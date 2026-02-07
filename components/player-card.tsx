"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, TrophyIcon, BoltIcon } from '@heroicons/react/24/outline'

/* ─── Sport → emoji mapping ─── */
const sportEmoji: Record<string, string> = {
    calcio: '⚽', basket: '🏀', pallavolo: '🏐', tennis: '🎾',
    nuoto: '🏊', atletica: '🏃', rugby: '🏉', ciclismo: '🚴',
}
function getSportIcon(sport?: string) {
    if (!sport) return '🏅'
    return sportEmoji[sport.toLowerCase()] || '🏅'
}

interface PlayerCardProps {
    player: any
    currentUserId: string | null
}

export default function PlayerCard({ player, currentUserId }: PlayerCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${player.id}`)
    }

    /* ── Derived data ── */
    const primaryPosition = player.footballPrimaryPosition || player.experiences?.[0]?.primaryPosition || player.currentRole || 'Giocatore'
    const positionDetail = player.footballSecondaryPosition || player.experiences?.[0]?.positionDetail || ''
    const mainSport = Array.isArray(player.sports) && player.sports.length > 0
        ? player.sports[0]
        : player.sport || 'Sport'
    const location = player.city || player.country || ''
    const isVerified = player.verified === true

    /* Latest experience → category / stats */
    const latestExp = Array.isArray(player.experiences) && player.experiences.length > 0 ? player.experiences[0] : null
    const category = latestExp?.category || ''
    const categoryTier = latestExp?.categoryTier || ''
    const lastGoals = latestExp?.goals != null ? Number(latestExp.goals) : null
    const lastAppearances = latestExp?.appearances != null ? Number(latestExp.appearances) : null
    const lastAssists = latestExp?.assists != null ? Number(latestExp.assists) : null

    /* Physical */
    const height = player.height ? `${player.height} cm` : null
    const foot = player.dominantFoot === 'destro' ? 'Destro' : player.dominantFoot === 'sinistro' ? 'Sinistro' : player.dominantFoot === 'ambidestro' ? 'Ambidestro' : null

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 h-full flex flex-col group">
            {/* ── Top bar: sport + category ── */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getSportIcon(mainSport)}</span>
                    <span className="text-white font-bold text-sm uppercase tracking-wide">{mainSport}</span>
                </div>
                {category && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-wider">
                        {category}
                    </span>
                )}
            </div>

            {/* ── Content ── */}
            <div className="px-4 pb-4 pt-3 flex flex-col h-full">
                {/* Identity row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar
                            src={player.avatarUrl || ''}
                            alt={`${player.firstName} ${player.lastName}`}
                            fallbackText={player.firstName?.charAt(0) || 'P'}
                            size="md"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-base text-gray-900 truncate">
                                    {player.firstName} {player.lastName}
                                </h3>
                                {isVerified && <CheckBadgeIcon className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />}
                            </div>
                            <p className="text-sm font-semibold text-green-700">{primaryPosition}</p>
                            {positionDetail && positionDetail !== primaryPosition && (
                                <p className="text-xs text-gray-500">{positionDetail}</p>
                            )}
                        </div>
                    </div>
                    {currentUserId && currentUserId !== player.id && (
                        <div className="flex-shrink-0">
                            <FollowButton targetId={player.id} />
                        </div>
                    )}
                </div>

                {/* ── Stat chips: prominent stats row ── */}
                {(lastGoals !== null || lastAppearances !== null || lastAssists !== null) && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {lastAppearances !== null && (
                            <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-2 text-center">
                                <div className="text-lg font-extrabold text-green-700">{lastAppearances}</div>
                                <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Presenze</div>
                            </div>
                        )}
                        {lastGoals !== null && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-2 text-center">
                                <div className="text-lg font-extrabold text-emerald-700">{lastGoals}</div>
                                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Gol</div>
                            </div>
                        )}
                        {lastAssists !== null && (
                            <div className="bg-teal-50 border border-teal-200 rounded-lg px-2 py-2 text-center">
                                <div className="text-lg font-extrabold text-teal-700">{lastAssists}</div>
                                <div className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">Assist</div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Meta row: location + physical ── */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                    {location && (
                        <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" /> {location}
                        </span>
                    )}
                    {height && (
                        <span className="inline-flex items-center gap-1">
                            📏 {height}
                        </span>
                    )}
                    {foot && (
                        <span className="inline-flex items-center gap-1">
                            🦶 {foot}
                        </span>
                    )}
                </div>

                {/* ── Badges: tier + availability ── */}
                <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
                    {categoryTier && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white uppercase tracking-wider">
                            {categoryTier}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${player.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                            : player.contractStatus === 'svincolato'
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                        {player.contractStatus === 'svincolato' ? '🟢 Svincolato' : player.availability || 'N/D'}
                    </span>
                </div>

                {/* View Profile Button */}
                <button
                    onClick={handleProfileClick}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
                >
                    Visualizza Profilo
                </button>
            </div>
        </div>
    )
}
