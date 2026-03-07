'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient, supabaseServer } from '@/lib/supabase-server'
import { PROFESSIONAL_ROLES, type ProfessionalRole } from '@/lib/types'

const COOKIE_KEY = 'sprinta_active_role'
// 30 giorni
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

async function resolveAuthenticatedUserId(authToken?: string): Promise<string | null> {
    if (authToken) {
        const { data: { user }, error } = await supabaseServer.auth.getUser(authToken)
        if (!error && user) return user.id
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

/**
 * Server Action: salva il ruolo attivo nel cookie e invalida la cache
 * dell'intera applicazione in modo che i Server Components ricarichino i dati.
 */
export async function switchActiveRole(roleId: ProfessionalRole, authToken?: string): Promise<void> {
    if (!PROFESSIONAL_ROLES.includes(roleId)) {
        throw new Error(`Ruolo non valido: ${roleId}`)
    }

    // Verifica che l'utente autenticato possieda effettivamente questo ruolo
    const userId = await resolveAuthenticatedUserId(authToken)
    if (!userId) throw new Error('Non autenticato')

    const { data: roleRow } = await supabaseServer
        .from('profile_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .maybeSingle()

    if (!roleRow) throw new Error('Permesso negato: ruolo non disponibile')

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_KEY, roleId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,          // non accessibile da JS client (sicurezza)
        sameSite: 'lax',
        path: '/',
    })

    // Invalida tutte le route che dipendono dal ruolo attivo
    revalidatePath('/', 'layout')
}

/**
 * Helper: legge il ruolo attivo dal cookie.
 * Se il cookie non esiste o è invalido, legge il ruolo dal profilo utente
 * (profile_roles o profiles.role_id) e lo persiste nel cookie.
 * Fallback finale a 'player'.
 */
export async function getActiveRole(): Promise<ProfessionalRole> {
    const cookieStore = await cookies()
    const value = cookieStore.get(COOKIE_KEY)?.value

    if (value && (PROFESSIONAL_ROLES as readonly string[]).includes(value)) {
        return value as ProfessionalRole
    }

    // Cookie assente o invalido → leggi il ruolo reale dell'utente dal DB
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Prova dalla nuova tabella profile_roles (ruolo primario)
            const { data: roleRow } = await supabase
                .from('profile_roles')
                .select('role_id')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .eq('is_primary', true)
                .maybeSingle()

            if (roleRow?.role_id && (PROFESSIONAL_ROLES as readonly string[]).includes(roleRow.role_id)) {
                return roleRow.role_id as ProfessionalRole
            }

            // Fallback: primo ruolo attivo in profile_roles
            const { data: anyRole } = await supabase
                .from('profile_roles')
                .select('role_id')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle()

            if (anyRole?.role_id && (PROFESSIONAL_ROLES as readonly string[]).includes(anyRole.role_id)) {
                return anyRole.role_id as ProfessionalRole
            }

            // Fallback legacy: profiles.role_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id')
                .eq('id', user.id)
                .is('deleted_at', null)
                .maybeSingle()

            if (profile?.role_id && (PROFESSIONAL_ROLES as readonly string[]).includes(profile.role_id)) {
                return profile.role_id as ProfessionalRole
            }
        }
    } catch {
        // In caso di errore DB, usa il fallback
    }

    return 'player'
}

/**
 * Server Action: cancella il cookie del ruolo attivo (usato al logout).
 */
export async function clearActiveRole(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_KEY)
}

/**
 * Server Action: rimuove un ruolo dall'utente (rollback dopo errore).
 * Usa il client server-side (bypassa RLS).
 */
export async function deleteProfileRole(roleId: string, authToken?: string): Promise<void> {
    const userId = await resolveAuthenticatedUserId(authToken)
    if (!userId) throw new Error('Non autenticato')

    await supabaseServer
        .from('profile_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)
}
