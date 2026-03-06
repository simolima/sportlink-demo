'use client'

import { useState, useTransition } from 'react'
import { XMarkIcon, PlusIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import {
    removeMemberFromTeam,
    assignMemberToTeam,
    TEAM_MEMBER_ROLE_LABELS,
    type TeamMemberRole,
    type AssignMemberInput,
} from '@/app/actions/team-management-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Tipi locali
// ─────────────────────────────────────────────────────────────────────────────

export interface TeamMember {
    memberId: string       // team_members.id
    profileId: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    role: TeamMemberRole
}

export interface AvailableClubMember {
    profileId: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    clubRole: string
}

export interface TeamInfo {
    id: string
    name: string
    category: string | null
    season: string | null
}

interface Props {
    team: TeamInfo
    members: TeamMember[]
    availableMembers: AvailableClubMember[]
    userId: string
    onMemberChanged?: () => void
}

// Ruoli considerati "staff" — tutto ciò che non è "player"
const STAFF_ROLES: TeamMemberRole[] = [
    'head_coach',
    'assistant_coach',
    'athletic_trainer',
    'physio',
    'nutritionist',
    'team_manager',
    'goalkeeper_coach',
]

// ─────────────────────────────────────────────────────────────────────────────
// TeamRosterCard — card per ogni squadra, con interazoni client-side
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamRosterCard({ team, members, availableMembers, userId, onMemberChanged }: Props) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedProfileId, setSelectedProfileId] = useState('')
    const [selectedRole, setSelectedRole] = useState<TeamMemberRole>('player')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const [isPendingRemove, startRemoveTransition] = useTransition()
    const [isPendingAdd, startAddTransition] = useTransition()

    const staffMembers = members.filter((m) => STAFF_ROLES.includes(m.role))
    const players = members.filter((m) => m.role === 'player')

    function handleRemove(profileId: string) {
        setErrorMsg(null)
        setRemovingId(profileId)
        startRemoveTransition(async () => {
            const result = await removeMemberFromTeam(team.id, profileId, userId)
            if (!result.success) {
                setErrorMsg(result.error)
            } else {
                onMemberChanged?.()
            }
            setRemovingId(null)
        })
    }

    function handleAdd() {
        if (!selectedProfileId) {
            setErrorMsg('Seleziona un membro da aggiungere.')
            return
        }
        setErrorMsg(null)
        startAddTransition(async () => {
            const input: AssignMemberInput = {
                teamId: team.id,
                profileId: selectedProfileId,
                role: selectedRole,
            }
            const result = await assignMemberToTeam(input, userId)
            if (result.success) {
                setSelectedProfileId('')
                setSelectedRole('player')
                setShowAddForm(false)
                onMemberChanged?.()
            } else {
                setErrorMsg(result.error)
            }
        })
    }

    return (
        <div className="card bg-white border border-base-200 shadow-sm">
            {/* ── Card header ── */}
            <div
                className="flex items-center justify-between px-4 pt-4 pb-3 cursor-pointer select-none"
                onClick={() => setIsExpanded((v) => !v)}
                role="button"
                aria-expanded={isExpanded}
            >
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
                    {(team.category || team.season) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            {[team.category, team.season].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge badge-ghost badge-sm text-gray-500">
                        {members.length} {members.length === 1 ? 'membro' : 'membri'}
                    </span>
                    {isExpanded ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            </div>

            {/* ── Expandable body ── */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Sezione Staff */}
                    {staffMembers.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Staff
                            </p>
                            <div className="space-y-1.5">
                                {staffMembers.map((m) => (
                                    <MemberRow
                                        key={m.memberId}
                                        member={m}
                                        isRemoving={removingId === m.profileId && isPendingRemove}
                                        onRemove={() => handleRemove(m.profileId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sezione Giocatori */}
                    {players.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Giocatori
                                <span className="ml-1.5 badge badge-ghost badge-xs font-normal">
                                    {players.length}
                                </span>
                            </p>
                            <div className="space-y-1.5">
                                {players.map((m) => (
                                    <MemberRow
                                        key={m.memberId}
                                        member={m}
                                        isRemoving={removingId === m.profileId && isPendingRemove}
                                        onRemove={() => handleRemove(m.profileId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stato vuoto */}
                    {members.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-3">
                            Nessun membro assegnato a questa squadra.
                        </p>
                    )}

                    {/* Messaggio errore */}
                    {errorMsg && (
                        <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                            {errorMsg}
                        </p>
                    )}

                    {/* ── Sezione aggiungi membro ── */}
                    <div className="pt-2 border-t border-base-200">
                        {!showAddForm ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(true)
                                    setErrorMsg(null)
                                }}
                                disabled={availableMembers.length === 0}
                                className="btn btn-sm btn-outline border-green-600 text-green-600 hover:bg-green-50 hover:border-green-600 w-full gap-1.5 disabled:opacity-50"
                            >
                                <PlusIcon className="h-4 w-4" />
                                {availableMembers.length === 0
                                    ? 'Tutti i tesserati sono già in squadra'
                                    : 'Aggiungi Membro'}
                            </button>
                        ) : (
                            <div className="space-y-2">
                                {/* Selettori */}
                                <div className="flex gap-2">
                                    {/* Membro */}
                                    <select
                                        value={selectedProfileId}
                                        onChange={(e) => setSelectedProfileId(e.target.value)}
                                        className="select select-bordered select-sm flex-1 focus:border-green-500 focus:outline-none text-sm"
                                        aria-label="Seleziona membro"
                                    >
                                        <option value="">-- Seleziona membro --</option>
                                        {availableMembers.map((m) => (
                                            <option key={m.profileId} value={m.profileId}>
                                                {m.firstName} {m.lastName}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Ruolo */}
                                    <select
                                        value={selectedRole}
                                        onChange={(e) =>
                                            setSelectedRole(e.target.value as TeamMemberRole)
                                        }
                                        className="select select-bordered select-sm focus:border-green-500 focus:outline-none text-sm"
                                        aria-label="Ruolo in squadra"
                                    >
                                        {(
                                            Object.entries(TEAM_MEMBER_ROLE_LABELS) as [
                                                TeamMemberRole,
                                                string,
                                            ][]
                                        ).map(([val, label]) => (
                                            <option key={val} value={val}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Bottoni conferma / annulla */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm(false)
                                            setSelectedProfileId('')
                                            setErrorMsg(null)
                                        }}
                                        className="btn btn-sm btn-ghost flex-1"
                                        disabled={isPendingAdd}
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        disabled={isPendingAdd || !selectedProfileId}
                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 border-0 flex-1 gap-1.5"
                                    >
                                        {isPendingAdd && (
                                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                        )}
                                        Aggiungi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberRow — riga per ogni membro nella card
// ─────────────────────────────────────────────────────────────────────────────

function MemberRow({
    member,
    isRemoving,
    onRemove,
}: {
    member: TeamMember
    isRemoving: boolean
    onRemove: () => void
}) {
    const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()

    return (
        <div className="flex items-center gap-2.5 py-0.5">
            {/* Avatar */}
            {member.avatarUrl ? (
                <div className="avatar flex-shrink-0">
                    <div className="w-7 h-7 rounded-full overflow-hidden">
                        <img
                            src={member.avatarUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            ) : (
                <div className="avatar placeholder flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{initials}</span>
                    </div>
                </div>
            )}

            {/* Nome */}
            <span className="text-sm text-gray-800 flex-1 truncate">
                {member.firstName} {member.lastName}
            </span>

            {/* Badge ruolo */}
            <span className="badge badge-ghost badge-sm text-gray-500 text-xs flex-shrink-0">
                {TEAM_MEMBER_ROLE_LABELS[member.role]}
            </span>

            {/* Bottone rimozione */}
            <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                className="btn btn-ghost btn-xs btn-circle text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                title={`Rimuovi ${member.firstName} dalla squadra`}
                aria-label={`Rimuovi ${member.firstName} ${member.lastName} dalla squadra`}
            >
                {isRemoving ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <XMarkIcon className="h-3.5 w-3.5" />
                )}
            </button>
        </div>
    )
}
