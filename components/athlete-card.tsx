"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

/* ─── Sport → emoji mapping ─── */
const sportEmoji: Record<string, string> = {
    calcio: '⚽', basket: '🏀', pallavolo: '🏐', tennis: '🎾',
    nuoto: '🏊', atletica: '🏃', rugby: '🏉', ciclismo: '🚴',
}
function getSportIcon(sport?: string) {
    if (!sport) return '🏅'
    return sportEmoji[sport.toLowerCase()] || '🏅'
}

interface AthleteCardProps {
    athlete: any
    currentUserId: string | null
}

export default function AthleteCard({ athlete, currentUserId }: AthleteCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${athlete.id}`)
    }

    /* ── Derived data ── */
    const primaryPosition = athlete.footballPrimaryPosition || athlete.experiences?.[0]?.primaryPosition || athlete.currentRole || athlete.level || 'Atleta'
    const positionDetail = athlete.footballSecondaryPosition || athlete.experiences?.[0]?.positionDetail || ''
    const mainSport = Array.isArray(athlete.sports) && athlete.sports.length > 0
        ? athlete.sports[0]
        : athlete.sport || 'Sport'
    const location = athlete.city || athlete.country || ''
    const isVerified = athlete.verified === true

    /* Latest experience → category / stats */
    const latestExp = Array.isArray(athlete.experiences) && athlete.experiences.length > 0 ? athlete.experiences[0] : null
    const category = latestExp?.category || ''
    const categoryTier = latestExp?.categoryTier || ''
    const lastGoals = latestExp?.goals != null ? Number(latestExp.goals) : null
    const lastAppearances = latestExp?.appearances != null ? Number(latestExp.appearances) : null

    /* Physical */
    const height = athlete.height ? `${athlete.height} cm` : null

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer h-full flex flex-col group">
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
                            src={athlete.avatarUrl || ''}
                            alt={`${athlete.firstName} ${athlete.lastName}`}
                            fallbackText={athlete.firstName?.charAt(0) || 'A'}
                            size="md"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-base text-gray-900 truncate">
                                    {athlete.firstName} {athlete.lastName}
                                </h3>
                                {isVerified && <CheckBadgeIcon className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />}
                            </div>
                            <p className="text-sm font-semibold text-green-700">{primaryPosition}</p>
                            {positionDetail && positionDetail !== primaryPosition && (
                                <p className="text-xs text-gray-500">{positionDetail}</p>
                            )}
                        </div>
                    </div>
                    {currentUserId && currentUserId !== athlete.id && (
                        <div className="flex-shrink-0">
                            <FollowButton targetId={athlete.id} />
                        </div>
                    )}
                </div>

                {/* ── Stat chips: prominent stats row ── */}
                {(lastGoals !== null || lastAppearances !== null) && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
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
                    </div>
                )}

                {/* Bio */}
                {athlete.bio && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{athlete.bio}</p>
                )}

                {/* ── Meta row: location + height ── */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                    {location && (
                        <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" /> {location}
                        </span>
                    )}
                    {height && (
                        <span className="inline-flex items-center gap-1">📏 {height}</span>
                    )}
                </div>

                {/* ── Badges: tier + availability ── */}
                <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
                    {categoryTier && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white uppercase tracking-wider">
                            {categoryTier}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${athlete.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                            : athlete.contractStatus === 'svincolato'
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                        {athlete.contractStatus === 'svincolato' ? '🟢 Svincolato' : athlete.availability || 'N/D'}
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
