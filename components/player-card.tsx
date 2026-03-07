"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, TrophyIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface PlayerCardProps {
    player: any
    currentUserId: string | null
}

export default function PlayerCard({ player, currentUserId }: PlayerCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${player.id}`)
    }

    const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Giocatore'
    const primaryPosition = player.primaryPosition || player.experiences?.[0]?.primaryPosition || player.level || ''
    const mainSport = Array.isArray(player.sports) && player.sports.length > 0
        ? player.sports[0]
        : player.sport || ''
    const city = player.city || ''
    const country = player.country || ''
    const isVerified = player.verified === true
    const lastSeasonGoals = player.experiences?.[0]?.goals ? parseInt(player.experiences[0].goals) : null
    const lastSeasonCategory = player.experiences?.[0]?.category || ''

    return (
        <div
            onClick={handleProfileClick}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col cursor-pointer group"
        >
            <div className="p-5 flex flex-col h-full">
                {/* Top: Avatar + Name + Follow */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar
                        src={player.avatarUrl || ''}
                        alt={fullName}
                        fallbackText={player.firstName?.charAt(0) || 'P'}
                        size="lg"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-brand-700 transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Giocatore{primaryPosition ? ` · ${primaryPosition}` : ''}
                        </p>
                    </div>
                    {currentUserId && currentUserId !== player.id && (
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <FollowButton targetId={player.id} />
                        </div>
                    )}
                </div>

                {/* Bio */}
                {player.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {player.bio}
                    </p>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                    {mainSport && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                            {mainSport}
                        </span>
                    )}
                    {lastSeasonCategory && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                            {lastSeasonCategory}
                        </span>
                    )}
                    {lastSeasonGoals !== null && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            <TrophyIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            {lastSeasonGoals} goal
                        </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${player.availability === 'Disponibile'
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                        {player.availability || 'Non specificato'}
                    </span>
                </div>

                {/* Location & Country footer */}
                {(city || country) && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        {city && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                <span>{city}</span>
                            </div>
                        )}
                        {country && (
                            <div className="flex items-center gap-1">
                                <GlobeAltIcon className="w-3.5 h-3.5" />
                                <span>{country}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
