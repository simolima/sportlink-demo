'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import {
    createTeamSchema,
    assignMemberSchema,
    type CreateTeamInput,
    type AssignMemberInput,
    type TeamActionResult,
} from '@/lib/team-types'

// Re-export types for backward compatibility
export type { TeamMemberRole, CreateTeamInput, AssignMemberInput, TeamActionResult } from '@/lib/team-types'

// ─────────────────────────────────────────────────────────────────────────────
// Helper — verifica permessi Admin/DS sul club
// ─────────────────────────────────────────────────────────────────────────────

async function checkAdminOrDS(
    userId: string,
    clubId: string,
): Promise<boolean> {
    // 1. È il proprietario del club?
    const { data: ownedClub } = await supabaseServer
        .from('clubs')
        .select('id')
        .eq('id', clubId)
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

    if (ownedClub) return true

    // 2. Ha un ruolo Admin nel club?
    const { data: membership } = await supabaseServer
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
    const { data: profile } = await supabaseServer
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
    userId: string,
): Promise<TeamActionResult<{ teamId: string }>> {
    try {
        if (!userId) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = createTeamSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const { clubId, name, category, season } = parsed.data

        const hasAccess = await checkAdminOrDS(userId, clubId)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per creare squadre in questo club.',
            }
        }

        const { data: team, error: insertError } = await supabaseServer
            .from('club_teams')
            .insert({
                club_id: clubId,
                name: name.trim(),
                category: category?.trim() || null,
                season: season?.trim() || null,
                created_by: userId,
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
    userId: string,
): Promise<TeamActionResult> {
    try {
        if (!userId) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = assignMemberSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const { teamId, profileId, role } = parsed.data

        // Recupera la squadra per ottenere il clubId
        const { data: team, error: teamError } = await supabaseServer
            .from('club_teams')
            .select('id, club_id')
            .eq('id', teamId)
            .is('deleted_at', null)
            .single()

        if (teamError || !team) {
            return { success: false, error: 'Squadra non trovata.' }
        }

        const hasAccess = await checkAdminOrDS(userId, team.club_id)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per modificare questa squadra.',
            }
        }

        // Verifica che il profilo sia un tesserato attivo del club
        const { data: clubMember } = await supabaseServer
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
        const { data: latestRow } = await supabaseServer
            .from('team_members')
            .select('id')
            .eq('club_team_id', teamId)
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (latestRow) {
            // Restore (se soft-deleted) e aggiorna ruolo
            const { error: updateError } = await supabaseServer
                .from('team_members')
                .update({ deleted_at: null, role, status: 'active' })
                .eq('id', latestRow.id)

            if (updateError) {
                console.error('[assignMemberToTeam] update error:', updateError)
                return { success: false, error: 'Errore durante l\'aggiornamento.' }
            }
        } else {
            // Prima volta: inserimento
            const { error: insertError } = await supabaseServer
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

        // Sincronizza club_memberships.club_role in base al ruolo nel team:
        // ruoli staff (head_coach, assistant_coach, …) → 'Staff', player → 'Player'
        const STAFF_TEAM_ROLES: readonly string[] = [
            'head_coach',
            'assistant_coach',
            'athletic_trainer',
            'physio',
            'nutritionist',
            'team_manager',
            'goalkeeper_coach',
        ]
        const newClubRole = STAFF_TEAM_ROLES.includes(role) ? 'Staff' : 'Player'

        // Aggiorna solo se il club_role attuale è diverso (e non è Admin)
        const { data: currentMembership } = await supabaseServer
            .from('club_memberships')
            .select('id, club_role')
            .eq('club_id', team.club_id)
            .eq('user_id', profileId)
            .eq('status', 'active')
            .is('deleted_at', null)
            .maybeSingle()

        if (
            currentMembership &&
            currentMembership.club_role !== 'Admin' &&
            currentMembership.club_role !== newClubRole
        ) {
            await supabaseServer
                .from('club_memberships')
                .update({ club_role: newClubRole })
                .eq('id', currentMembership.id)
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
    userId: string,
): Promise<TeamActionResult> {
    try {
        if (!userId) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        if (!teamId || !profileId) {
            return { success: false, error: 'Parametri non validi.' }
        }

        // Recupera la squadra per il controllo permessi
        const { data: team, error: teamError } = await supabaseServer
            .from('club_teams')
            .select('id, club_id')
            .eq('id', teamId)
            .is('deleted_at', null)
            .single()

        if (teamError || !team) {
            return { success: false, error: 'Squadra non trovata.' }
        }

        const hasAccess = await checkAdminOrDS(userId, team.club_id)
        if (!hasAccess) {
            return {
                success: false,
                error: 'Non hai i permessi per modificare questa squadra.',
            }
        }

        const { error: updateError } = await supabaseServer
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
