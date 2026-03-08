'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-browser'
import CreateTeamModal from '@/components/club-admin/CreateTeamModal'
import TeamRosterCard from '@/components/club-admin/TeamRosterCard'
import type { TeamMemberRole } from '@/lib/team-types'
import type { TeamMember, AvailableClubMember, TeamInfo } from '@/components/club-admin/TeamRosterCard'

// ─────────────────────────────────────────────────────────────────────────────
// Tipi DB (snake_case, come restituiti da Supabase)
// ─────────────────────────────────────────────────────────────────────────────

interface DbTeam {
    id: string
    name: string
    category: string | null
    season: string | null
}

interface DbTeamMember {
    id: string
    club_team_id: string
    profile_id: string
    role: TeamMemberRole
    jersey_number: number | null
    profiles: {
        first_name: string | null
        last_name: string | null
        avatar_url: string | null
    } | null
}

interface Props {
    clubId: string
    userId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget principale (Client Component)
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamManagementWidget({ clubId, userId }: Props) {
    const [teams, setTeams] = useState<DbTeam[]>([])
    const [teamMembers, setTeamMembers] = useState<DbTeamMember[]>([])
    const [allClubMembers, setAllClubMembers] = useState<AvailableClubMember[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)

        // 1. Squadre del club
        const { data: teamsRaw, error: teamsError } = await supabase
            .from('club_teams')
            .select('id, name, category, season')
            .eq('club_id', clubId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })

        if (teamsError) {
            console.error('[TeamManagementWidget] teams query error:', teamsError)
            setLoading(false)
            return
        }

        const fetchedTeams = (teamsRaw as DbTeam[]) ?? []
        const teamIds = fetchedTeams.map((t) => t.id)

        // 2. Membri delle squadre + tesserati del club — in parallelo
        // club_memberships usa API route (supabaseServer) perché la tabella
        // ha RLS abilitato senza policy SELECT per il browser client.
        const [membersResult, clubMembersRes] = await Promise.all([
            teamIds.length > 0
                ? supabase
                    .from('team_members')
                    .select('id, club_team_id, profile_id, role, jersey_number, profiles(first_name, last_name, avatar_url)')
                    .in('club_team_id', teamIds)
                    .is('deleted_at', null)
                : Promise.resolve({ data: [], error: null }),
            fetch(`/api/club-memberships?clubId=${encodeURIComponent(clubId)}`).then(r => r.json()).catch(() => []),
        ])

        if (membersResult.error) {
            console.error('[TeamManagementWidget] team_members query error:', membersResult.error)
        }

        const fetchedTeamMembers = (membersResult.data as unknown as DbTeamMember[]) ?? []
        const clubMembersRaw: any[] = Array.isArray(clubMembersRes) ? clubMembersRes : []

        const mappedClubMembers: AvailableClubMember[] = clubMembersRaw
            .filter((cm: any) => cm.user)
            .map((cm: any) => ({
                profileId: cm.userId,
                firstName: cm.user?.firstName ?? '',
                lastName: cm.user?.lastName ?? '',
                avatarUrl: cm.user?.avatarUrl ?? null,
                clubRole: cm.role,
            }))

        setTeams(fetchedTeams)
        setTeamMembers(fetchedTeamMembers)
        setAllClubMembers(mappedClubMembers)
        setLoading(false)
    }, [clubId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ─── Loading skeleton ───
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-40 rounded bg-base-300" />
                {[1, 2].map((i) => (
                    <div key={i} className="card glass-widget border border-base-300/70 shadow-sm p-5">
                        <div className="h-5 w-32 rounded bg-base-300 mb-4" />
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-base-200" />
                            <div className="h-4 w-3/4 rounded bg-base-200" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Mappa profileId → set di teamIds in cui è già assegnato (evita duplicati)
    const assignedByTeam = new Map<string, Set<string>>()
    for (const m of teamMembers) {
        if (!assignedByTeam.has(m.club_team_id)) {
            assignedByTeam.set(m.club_team_id, new Set())
        }
        assignedByTeam.get(m.club_team_id)!.add(m.profile_id)
    }

    return (
        <div className="space-y-5">
            {/* ── Intestazione widget ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    <h2 className="font-semibold text-base-content text-base">Gestione Squadre</h2>
                    {teams.length > 0 && (
                        <span className="badge badge-ghost badge-sm text-secondary">
                            {teams.length}
                        </span>
                    )}
                </div>
                <CreateTeamModal clubId={clubId} userId={userId} onCreated={fetchData} />
            </div>

            {/* ── Stato vuoto ── */}
            {teams.length === 0 && (
                <div className="card glass-widget border border-base-300/70">
                    <div className="card-body items-center py-12 text-center gap-3">
                        <div className="rounded-full bg-primary/10 p-4">
                            <UserGroupIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base-content">Nessuna squadra</h3>
                            <p className="text-sm glass-subtle-text mt-1 max-w-xs">
                                Crea la prima squadra per iniziare ad organizzare i tuoi giocatori
                                in rosa.
                            </p>
                        </div>
                        <CreateTeamModal clubId={clubId} userId={userId} onCreated={fetchData} />
                    </div>
                </div>
            )}

            {/* ── Griglia card squadre ── */}
            {teams.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {teams.map((team) => {
                        const teamInfo: TeamInfo = {
                            id: team.id,
                            name: team.name,
                            category: team.category,
                            season: team.season,
                        }

                        const members: TeamMember[] = teamMembers
                            .filter((m) => m.club_team_id === team.id)
                            .map((m) => ({
                                memberId: m.id,
                                profileId: m.profile_id,
                                firstName: m.profiles?.first_name ?? '',
                                lastName: m.profiles?.last_name ?? '',
                                avatarUrl: m.profiles?.avatar_url ?? null,
                                role: m.role,
                                jerseyNumber: m.jersey_number ?? null,
                            }))

                        const alreadyInThisTeam = assignedByTeam.get(team.id) ?? new Set<string>()
                        const availableMembers: AvailableClubMember[] = allClubMembers.filter(
                            (cm) => !alreadyInThisTeam.has(cm.profileId),
                        )

                        return (
                            <TeamRosterCard
                                key={team.id}
                                team={teamInfo}
                                members={members}
                                availableMembers={availableMembers}
                                userId={userId}
                                onMemberChanged={fetchData}
                            />
                        )
                    })}
                </div>
            )}

            {/* Info: quanti tesserati non sono in nessuna squadra */}
            {teams.length > 0 && allClubMembers.length > 0 && (() => {
                const assignedProfiles = new Set(teamMembers.map((m) => m.profile_id))
                const unassigned = allClubMembers.filter(
                    (cm) => !assignedProfiles.has(cm.profileId),
                ).length
                return unassigned > 0 ? (
                    <p className="text-xs glass-subtle-text text-right">
                        {unassigned} tesserato{unassigned !== 1 ? 'i' : ''} non ancora assegnat
                        {unassigned !== 1 ? 'i' : 'o'} a nessuna squadra
                    </p>
                ) : null
            })()}
        </div>
    )
}
