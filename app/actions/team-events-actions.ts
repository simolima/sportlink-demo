'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod — unica source of truth per validazione client e server
// ─────────────────────────────────────────────────────────────────────────────
export const createTeamEventSchema = z.object({
    teamId: z.string().uuid('ID team non valido'),
    eventType: z.enum(['training', 'match'], {
        required_error: 'Seleziona il tipo di evento',
    }),
    title: z.string().max(160, 'Titolo troppo lungo').nullable().optional(),
    dateTime: z
        .string()
        .min(1, 'Data e ora obbligatorie')
        .refine((v) => !isNaN(Date.parse(v)), 'Data non valida')
        .refine((v) => new Date(v) > new Date(), 'La data deve essere futura'),
    location: z.string().max(200, 'Luogo troppo lungo').nullable().optional(),
    description: z.string().max(1000, 'Descrizione troppo lunga').nullable().optional(),
    // Campi specifici per le partite
    opponent: z.string().max(120, 'Nome avversario troppo lungo').nullable().optional(),
    isHome: z.boolean().nullable().optional(),
})

export type CreateTeamEventInput = z.infer<typeof createTeamEventSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Tipo risposta — usato dal Client Component per il feedback
// ─────────────────────────────────────────────────────────────────────────────
export type ActionResult =
    | { success: true; eventId: string }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Server Action
// ─────────────────────────────────────────────────────────────────────────────
export async function createTeamEvent(input: CreateTeamEventInput): Promise<ActionResult> {
    try {
        // 1. Autenticazione — non fidarsi degli ID nel body
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        // 2. Validazione server-side dello schema (difesa in profondità)
        const parsed = createTeamEventSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const data = parsed.data

        // 3. Verifica che l'utente sia il proprietario del club che possiede questo team
        //    oppure un membro staff autorizzato (coach/athletic_trainer).
        //    Usiamo due query semplici per chiarezza (Supabase JS non supporta bene
        //    le subquery EXISTS in una singola chiamata).
        const { data: team, error: teamError } = await supabase
            .from('club_teams')
            .select('id, club_id')
            .eq('id', data.teamId)
            .is('deleted_at', null)
            .single()

        if (teamError || !team) {
            return { success: false, error: 'Team non trovato.' }
        }

        // Verifica: l'utente è owner del club O membro staff del team
        const [{ data: ownerClub }, { data: membership }] = await Promise.all([
            supabase
                .from('clubs')
                .select('id')
                .eq('id', team.club_id)
                .eq('owner_id', user.id)
                .is('deleted_at', null)
                .maybeSingle(),
            supabase
                .from('team_members')
                .select('id, role')
                .eq('club_team_id', data.teamId)
                .eq('profile_id', user.id)
                .in('role', ['head_coach', 'assistant_coach', 'athletic_trainer', 'team_manager'])
                .is('deleted_at', null)
                .maybeSingle(),
        ])

        if (!ownerClub && !membership) {
            return {
                success: false,
                error: 'Non hai i permessi per creare eventi in questo team.',
            }
        }

        // 4. Inserimento in DB — mapping camelCase → snake_case
        const { data: newEvent, error: insertError } = await supabase
            .from('team_events')
            .insert({
                team_id: data.teamId,
                created_by: user.id,
                event_type: data.eventType,
                title: data.title ?? null,
                date_time: data.dateTime,
                location: data.location ?? null,
                description: data.description ?? null,
                opponent: data.opponent ?? null,
                is_home: data.isHome ?? null,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[createTeamEvent] DB error:', insertError)
            return { success: false, error: 'Errore durante il salvataggio. Riprova.' }
        }

        // 5. Invalida la cache del dashboard così il widget si aggiorna
        revalidatePath('/dashboard')

        return { success: true, eventId: newEvent.id }
    } catch (err) {
        console.error('[createTeamEvent] Unexpected error:', err)
        return { success: false, error: 'Errore imprevisto. Riprova più tardi.' }
    }
}
