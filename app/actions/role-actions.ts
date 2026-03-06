'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { PROFESSIONAL_ROLES, type ProfessionalRole } from '@/lib/types'

const COOKIE_KEY = 'sprinta_active_role'
// 30 giorni
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Server Action: salva il ruolo attivo nel cookie e invalida la cache
 * dell'intera applicazione in modo che i Server Components ricarichino i dati.
 */
export async function switchActiveRole(roleId: ProfessionalRole): Promise<void> {
    if (!PROFESSIONAL_ROLES.includes(roleId)) {
        throw new Error(`Ruolo non valido: ${roleId}`)
    }

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
 * Fallback a 'player' se il cookie non esiste o contiene un valore non valido.
 * Può essere chiamato direttamente dai Server Components.
 */
export async function getActiveRole(): Promise<ProfessionalRole> {
    const cookieStore = await cookies()
    const value = cookieStore.get(COOKIE_KEY)?.value

    if (value && (PROFESSIONAL_ROLES as readonly string[]).includes(value)) {
        return value as ProfessionalRole
    }

    return 'player'
}
