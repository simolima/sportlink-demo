// Server Component — nessuna direttiva 'use client'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { createServerClient } from '@/lib/supabase-server'
import CreateEventModal from '@/components/events/CreateEventModal'
import type { ProfessionalRole } from '@/lib/types'

interface Props {
    userId: string
    activeRole: ProfessionalRole
}

// Tipo camelCase usato nella UI — mapping esplicitato qui
interface TeamEvent {
    id: string
    eventType: 'training' | 'match'
    title: string | null
    dateTime: string
    location: string | null
    opponent: string | null
    isHome: boolean | null
    // teamId: incluso per passarlo al modal "crea evento"
    teamId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch per COACH / SPORTING_DIRECTOR / ATHLETIC_TRAINER:
//   prende tutti gli eventi dei team in cui l'utente è creatore o membro staff.
//   Due query semplici invece di una join complessa → più leggibili e debuggabili.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchEventsForCoach(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
): Promise<TeamEvent[]> {
    // Step 1: team_ids di cui l'utente è responsabile (owner club o membro staff)
    const { data: memberRows } = await supabase
        .from('team_members')
        .select('club_team_id')
        .eq('profile_id', userId)
        .in('role', ['head_coach', 'assistant_coach', 'athletic_trainer', 'team_manager'])
        .is('deleted_at', null)

    // Anche i team dei club di cui è owner
    const { data: ownedTeams } = await supabase
        .from('club_teams')
        .select('id, clubs!inner(owner_id)')
        .eq('clubs.owner_id', userId)
        .is('deleted_at', null)

    const teamIds = [
        ...(memberRows ?? []).map((r: { club_team_id: string }) => r.club_team_id),
        ...(ownedTeams ?? []).map((r: { id: string }) => r.id),
    ]
    // Deduplica
    const uniqueTeamIds = [...new Set(teamIds)]

    if (uniqueTeamIds.length === 0) return []

    // Step 2: eventi futuri per questi team
    const { data: rows, error } = await supabase
        .from('team_events')
        .select('id, team_id, event_type, title, date_time, location, opponent, is_home')
        .in('team_id', uniqueTeamIds)
        .gte('date_time', new Date().toISOString())
        .is('deleted_at', null)
        .order('date_time', { ascending: true })
        .limit(8)

    if (error) {
        console.error('[TeamEventsWidget] fetchEventsForCoach error:', error)
        return []
    }

    // Mapping snake_case → camelCase
    return (rows ?? []).map((r: {
        id: string
        team_id: string
        event_type: string
        title: string | null
        date_time: string
        location: string | null
        opponent: string | null
        is_home: boolean | null
    }) => ({
        id: r.id,
        teamId: r.team_id,
        eventType: r.event_type as 'training' | 'match',
        title: r.title,
        dateTime: r.date_time,
        location: r.location,
        opponent: r.opponent,
        isHome: r.is_home,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch per PLAYER:
//   prende gli eventi dei team a cui l'atleta è assegnato come player.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchEventsForPlayer(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
): Promise<TeamEvent[]> {
    // Step 1: team a cui appartiene come giocatore
    const { data: memberRows } = await supabase
        .from('team_members')
        .select('club_team_id')
        .eq('profile_id', userId)
        .eq('role', 'player')
        .is('deleted_at', null)

    const teamIds = (memberRows ?? []).map((r: { club_team_id: string }) => r.club_team_id)
    if (teamIds.length === 0) return []

    // Step 2: eventi futuri
    const { data: rows, error } = await supabase
        .from('team_events')
        .select('id, team_id, event_type, title, date_time, location, opponent, is_home')
        .in('team_id', teamIds)
        .gte('date_time', new Date().toISOString())
        .is('deleted_at', null)
        .order('date_time', { ascending: true })
        .limit(8)

    if (error) {
        console.error('[TeamEventsWidget] fetchEventsForPlayer error:', error)
        return []
    }

    return (rows ?? []).map((r: {
        id: string
        team_id: string
        event_type: string
        title: string | null
        date_time: string
        location: string | null
        opponent: string | null
        is_home: boolean | null
    }) => ({
        id: r.id,
        teamId: r.team_id,
        eventType: r.event_type as 'training' | 'match',
        title: r.title,
        dateTime: r.date_time,
        location: r.location,
        opponent: r.opponent,
        isHome: r.is_home,
    }))
}

const COACH_ROLES: ProfessionalRole[] = ['coach', 'sporting_director', 'athletic_trainer']

async function fetchUpcomingTeamEvents(
    userId: string,
    activeRole: ProfessionalRole,
): Promise<TeamEvent[]> {
    const supabase = await createServerClient()

    return COACH_ROLES.includes(activeRole)
        ? fetchEventsForCoach(supabase, userId)
        : fetchEventsForPlayer(supabase, userId)
}

function EventTypeLabel({ type }: { type: 'training' | 'match' }) {
    return type === 'match' ? (
        <span className="badge badge-sm bg-brand-100 text-brand-700 border-0">Partita</span>
    ) : (
        <span className="badge badge-sm bg-gray-100 text-gray-600 border-0">Allenamento</span>
    )
}

export default async function TeamEventsWidget({ userId, activeRole }: Props) {
    const events = await fetchUpcomingTeamEvents(userId, activeRole)

    // Il teamId per il modal: usa quello del primo evento oppure undefined.
    // In una UI completa l'utente selezionerebbe il team; qui lo deduciamo.
    const firstTeamId = events[0]?.teamId ?? ''

    return (
        <div className="card bg-white border border-base-200 shadow-sm">
            <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title text-base font-semibold text-gray-800 gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-brand-600" />
                        Prossimi Allenamenti &amp; Partite
                    </h2>
                    {/* Il modal è un Client Component: appare solo per i ruoli con permesso */}
                    {firstTeamId && (
                        <CreateEventModal teamId={firstTeamId} activeRole={activeRole} />
                    )}
                </div>

                {events.length === 0 ? (
                    <p className="text-sm text-gray-400">Nessun evento in programma.</p>
                ) : (
                    <ul className="space-y-3">
                        {events.map((event) => {
                            const date = new Date(event.dateTime)
                            const label = event.eventType === 'match' && event.opponent
                                ? `vs ${event.opponent}${event.isHome ? ' (Casa)' : ' (Trasferta)'}`
                                : event.title ?? 'Allenamento'

                            return (
                                <li
                                    key={event.id}
                                    className="flex items-start gap-3 rounded-lg border border-base-100 bg-gray-50 px-3 py-2.5"
                                >
                                    <div className="flex-shrink-0 text-center min-w-[2.5rem]">
                                        <p className="text-xs font-bold uppercase text-brand-600">
                                            {date.toLocaleDateString('it-IT', { weekday: 'short' })}
                                        </p>
                                        <p className="text-lg font-bold leading-none text-gray-800">
                                            {date.getDate()}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <EventTypeLabel type={event.eventType} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 truncate">{label}</p>
                                        {event.location && (
                                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                <MapPinIcon className="h-3 w-3" />
                                                {event.location}
                                            </p>
                                        )}
                                    </div>
                                    <p className="flex-shrink-0 text-xs text-gray-400 mt-0.5">
                                        {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
