'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Costanti & Tipi
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_MEMBER_ROLES = [
    'player',
    'head_coach',
    'assistant_coach',
    'athletic_trainer',
    'physio',
    'nutritionist',
    'team_manager',
    'goalkeeper_coach',
] as const

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number]

export const TEAM_MEMBER_ROLE_LABELS: Record<TeamMemberRole, string> = {
    player: 'Giocatore',
    head_coach: 'Allenatore',
    assistant_coach: 'Ass. Allenatore',
    athletic_trainer: 'Prep. Atletico',
    physio: 'Fisioterapista',
    nutritionist: 'Nutrizionista',
    team_manager: 'Team Manager',
    goalkeeper_coach: 'All. Portieri',
}

export type TeamActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod
// ─────────────────────────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
    clubId: z.string().uuid('ID club non valido'),
    name: z
        .string()
        .min(1, 'Il nome della squadra è obbligatorio')
        .max(100, 'Nome troppo lungo (max 100 caratteri)'),
    category: z.string().max(80, 'Categoria troppo lunga').nullable().optional(),
    season: z.string().max(20, 'Stagione troppo lunga').nullable().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

export const assignMemberSchema = z.object({
    teamId: z.string().uuid('ID squadra non valido'),
    profileId: z.string().uuid('ID profilo non valido'),
    role: z.enum(TEAM_MEMBER_ROLES, {
        required_error: 'Ruolo obbligatorio',
        invalid_type_error: 'Ruolo non valido',
    }),
})

export type AssignMemberInput = z.infer<typeof assignMemberSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Helper — verifica permessi Admin/DS sul club
// ─────────────────────────────────────────────────────────────────────────────

async function checkAdminOrDS(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
    clubId: string,
): Promise<boolean> {
    // 1. È il proprietario del club?
    const { data: ownedClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('id', clubId)
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

    if (ownedClub) return true

    // 2. Ha un ruolo Admin nel club?
    const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_role')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('club_role', ['Admin', 'Staff'])
        .is('deleted_at', null)
        .maybeSingle()

    if (!membership) return false
    if (membership.club_role === 'Admin') return true

    // 3. È Staff con ruolo DS (sporting_director)?
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .maybeSingle()

    return profile?.role_id === 'sporting_director'
}

// ─────────────────────────────────────────────────────────────────────────────
// createTeam
// ─────────────────────────────────────────────────────────────────────────────

export async function createTeam(
    input: CreateTeamInput,
): Promise<TeamActionResult<{ teamId: string }>> {
    try {
        const supabase = await createServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = createTeamSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const { clubId, name, category, season } = parsed.data

        const hasAccess = await checkAdminOrDS(supabase, user.id, clubId)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per creare squadre in questo club.',
            }
        }

        const { data: team, error: insertError } = await supabase
            .from('club_teams')
            .insert({
                club_id: clubId,
                name: name.trim(),
                category: category?.trim() || null,
                season: season?.trim() || null,
                created_by: user.id,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[createTeam] DB error:', insertError)
            return { success: false, error: 'Errore durante il salvataggio. Riprova.' }
        }

        revalidatePath('/dashboard')
        revalidatePath(`/clubs/${clubId}`)

        return { success: true, data: { teamId: team.id } }
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Errore imprevisto.' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// assignMemberToTeam
// ─────────────────────────────────────────────────────────────────────────────

export async function assignMemberToTeam(
    input: AssignMemberInput,
): Promise<TeamActionResult> {
    try {
        const supabase = await createServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = assignMemberSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const { teamId, profileId, role } = parsed.data

        // Recupera la squadra per ottenere il clubId
        const { data: team, error: teamError } = await supabase
            .from('club_teams')
            .select('id, club_id')
            .eq('id', teamId)
            .is('deleted_at', null)
            .single()

        if (teamError || !team) {
            return { success: false, error: 'Squadra non trovata.' }
        }

        const hasAccess = await checkAdminOrDS(supabase, user.id, team.club_id)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per modificare questa squadra.',
            }
        }

        // Verifica che il profilo sia un tesserato attivo del club
        const { data: clubMember } = await supabase
            .from('club_memberships')
            .select('id')
            .eq('club_id', team.club_id)
            .eq('user_id', profileId)
            .eq('status', 'active')
            .is('deleted_at', null)
            .maybeSingle()

        if (!clubMember) {
            return {
                success: false,
                error: 'Il profilo selezionato non è un tesserato attivo di questo club.',
            }
        }

        // Cerca un record esistente (anche soft-deleted) per evitare duplicati
        // e gestire il restore correttamente
        const { data: latestRow } = await supabase
            .from('team_members')
            .select('id')
            .eq('club_team_id', teamId)
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (latestRow) {
            // Restore (se soft-deleted) e aggiorna ruolo
            const { error: updateError } = await supabase
                .from('team_members')
                .update({ deleted_at: null, role, status: 'active' })
                .eq('id', latestRow.id)

            if (updateError) {
                console.error('[assignMemberToTeam] update error:', updateError)
                return { success: false, error: 'Errore durante l\'aggiornamento.' }
            }
        } else {
            // Prima volta: inserimento
            const { error: insertError } = await supabase
                .from('team_members')
                .insert({
                    club_team_id: teamId,
                    profile_id: profileId,
                    role,
                    status: 'active',
                })

            if (insertError) {
                console.error('[assignMemberToTeam] insert error:', insertError)
                return { success: false, error: 'Errore durante l\'inserimento.' }
            }
        }

        revalidatePath('/dashboard')
        revalidatePath(`/clubs/${team.club_id}`)

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Errore imprevisto.' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// removeMemberFromTeam
// ─────────────────────────────────────────────────────────────────────────────

export async function removeMemberFromTeam(
    teamId: string,
    profileId: string,
): Promise<TeamActionResult> {
    try {
        const supabase = await createServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        if (!teamId || !profileId) {
            return { success: false, error: 'Parametri non validi.' }
        }

        // Recupera la squadra per il controllo permessi
        const { data: team, error: teamError } = await supabase
            .from('club_teams')
            .select('id, club_id')
            .eq('id', teamId)
            .is('deleted_at', null)
            .single()

        if (teamError || !team) {
            return { success: false, error: 'Squadra non trovata.' }
        }

        const hasAccess = await checkAdminOrDS(supabase, user.id, team.club_id)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per modificare questa squadra.',
            }
        }

        const { error: updateError } = await supabase
            .from('team_members')
            .update({ deleted_at: new Date().toISOString() })
            .eq('club_team_id', teamId)
            .eq('profile_id', profileId)
            .is('deleted_at', null)

        if (updateError) {
            console.error('[removeMemberFromTeam] DB error:', updateError)
            return { success: false, error: 'Errore durante la rimozione.' }
        }

        revalidatePath('/dashboard')
        revalidatePath(`/clubs/${team.club_id}`)

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Errore imprevisto.' }
    }
}
