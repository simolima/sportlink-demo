'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Costanti condivise con la UI
// ─────────────────────────────────────────────────────────────────────────────

export const INJURY_TYPES = [
    'Muscolare',
    'Articolare',
    'Trauma',
    'Malattia',
    'Altro',
] as const

export type InjuryType = (typeof INJURY_TYPES)[number]

export const INJURY_SEVERITIES = ['Lieve', 'Moderato', 'Grave'] as const
export type InjurySeverity = (typeof INJURY_SEVERITIES)[number]

export const INJURY_STATUSES = ['Active', 'Recovering', 'Resolved'] as const
export type InjuryStatus = (typeof INJURY_STATUSES)[number]

export const INJURY_STATUS_LABELS: Record<InjuryStatus, string> = {
    Active: 'Infortunato',
    Recovering: 'In Recupero',
    Resolved: 'Guarito',
}

export type InjuryActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

const AUTHORIZED_INJURY_ROLES = ['physio', 'coach', 'sporting_director', 'athletic_trainer']

async function getAuthorizedRoleForUser(supabase: any, userId: string): Promise<string | null> {
    const { data: roleRow } = await supabase
        .from('profile_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('role_id', AUTHORIZED_INJURY_ROLES)
        .limit(1)
        .maybeSingle()

    if (roleRow?.role_id) return roleRow.role_id

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .is('deleted_at', null)
        .maybeSingle()

    return profile?.role_id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod — reportInjury
// ─────────────────────────────────────────────────────────────────────────────

export const reportInjurySchema = z.object({
    athleteProfileId: z.string().uuid('ID atleta non valido'),
    injuryType: z.enum(INJURY_TYPES, {
        required_error: 'Tipo infortunio obbligatorio',
    }),
    bodyPart: z.string().max(100, 'Campo troppo lungo').nullable().optional(),
    severity: z.enum(INJURY_SEVERITIES, {
        required_error: 'Gravità obbligatoria',
    }),
    startDate: z
        .string()
        .min(1, 'Data inizio obbligatoria')
        .refine((v) => !isNaN(Date.parse(v)), 'Data non valida'),
    expectedReturnDate: z
        .string()
        .nullable()
        .optional()
        .refine(
            (v) => !v || !isNaN(Date.parse(v)),
            'Data di rientro stimata non valida',
        ),
    notes: z.string().max(800, 'Note troppo lunghe (max 800 caratteri)').nullable().optional(),
}).refine(
    (d) => {
        if (!d.expectedReturnDate) return true
        return new Date(d.expectedReturnDate) >= new Date(d.startDate)
    },
    {
        message: 'La data di rientro stimata non può essere prima della data di inizio.',
        path: ['expectedReturnDate'],
    },
)

export type ReportInjuryInput = z.infer<typeof reportInjurySchema>

// ─────────────────────────────────────────────────────────────────────────────
// reportInjury
// ─────────────────────────────────────────────────────────────────────────────

export async function reportInjury(
    input: ReportInjuryInput,
): Promise<InjuryActionResult<{ injuryId: string }>> {
    try {
        const supabase = await createServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = reportInjurySchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const d = parsed.data

        // Verifica che l'atleta target esista (prevenzione IDOR)
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('id, role_id')
            .eq('id', d.athleteProfileId)
            .is('deleted_at', null)
            .maybeSingle()

        if (!targetProfile) {
            return { success: false, error: 'Atleta non trovato.' }
        }

        // Autorizzazione: il caller è l'atleta stesso, oppure ha un ruolo autorizzato
        const isSelf = user.id === d.athleteProfileId

        if (!isSelf) {
            // Verifica che il reporter abbia un ruolo autorizzato
            const reporterRoleId = await getAuthorizedRoleForUser(supabase, user.id)
            if (!reporterRoleId || !AUTHORIZED_INJURY_ROLES.includes(reporterRoleId)) {
                return {
                    success: false,
                    error: 'Non hai i permessi per segnalare infortuni di altri utenti.',
                }
            }
        }

        // Inserimento
        const { data: injury, error: insertError } = await supabase
            .from('athlete_injuries')
            .insert({
                athlete_profile_id: d.athleteProfileId,
                reported_by_profile_id: user.id,   // ← sempre il caller
                injury_type: d.injuryType,
                body_part: d.bodyPart ?? null,
                severity: d.severity,
                start_date: d.startDate,
                expected_return_date: d.expectedReturnDate ?? null,
                status: 'Active',
                notes: d.notes ?? null,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[reportInjury] DB error:', insertError)
            return { success: false, error: 'Errore durante il salvataggio. Riprova.' }
        }

        revalidatePath('/dashboard')
        revalidatePath(`/profile/${d.athleteProfileId}`)

        return { success: true, data: { injuryId: injury.id } }
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Errore imprevisto.' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveInjury
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveInjury(injuryId: string): Promise<InjuryActionResult> {
    try {
        const supabase = await createServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        if (!injuryId) {
            return { success: false, error: 'ID infortunio mancante.' }
        }

        // Recupera l'infortunio per controllo permessi
        const { data: injury, error: fetchError } = await supabase
            .from('athlete_injuries')
            .select('id, athlete_profile_id, reported_by_profile_id')
            .eq('id', injuryId)
            .is('deleted_at', null)
            .single()

        if (fetchError || !injury) {
            return { success: false, error: 'Infortunio non trovato.' }
        }

        // Può segnare "Resolved" solo l'atleta o chi ha inserito il record
        const canResolve =
            user.id === injury.athlete_profile_id ||
            user.id === injury.reported_by_profile_id

        if (!canResolve) {
            // Fallback: controlla se ha un ruolo autorizzato
            const reporterRoleId = await getAuthorizedRoleForUser(supabase, user.id)
            if (!reporterRoleId || !AUTHORIZED_INJURY_ROLES.includes(reporterRoleId)) {
                return {
                    success: false,
                    error: 'Non hai i permessi per aggiornare questo infortunio.',
                }
            }
        }

        const { error: updateError } = await supabase
            .from('athlete_injuries')
            .update({ status: 'Resolved' })
            .eq('id', injuryId)

        if (updateError) {
            console.error('[resolveInjury] DB error:', updateError)
            return { success: false, error: 'Errore durante l\'aggiornamento. Riprova.' }
        }

        revalidatePath('/dashboard')
        revalidatePath(`/profile/${injury.athlete_profile_id}`)

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Errore imprevisto.' }
    }
}
