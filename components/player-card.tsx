"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, TrophyIcon } from '@heroicons/react/24/outline'

interface PlayerCardProps {
    player: any
    currentUserId: string | null
}

export default function PlayerCard({ player, currentUserId }: PlayerCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${player.id}`)
    }

    const primaryPosition = player.experiences?.[0]?.primaryPosition || player.level || 'Giocatore'
    const mainSport = Array.isArray(player.sports) && player.sports.length > 0
        ? player.sports[0]
        : player.sport || 'Sport'
    const location = player.city || player.country || 'Non specificato'
    const isVerified = player.verified === true
    const lastSeasonGoals = player.experiences?.[0]?.goals ? parseInt(player.experiences[0].goals) : null
    const lastSeasonCategory = player.experiences?.[0]?.category || ''

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            {/* Header with blue gradient for Players */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-20" />

            {/* Content */}
            <div className="px-4 pb-4 flex flex-col h-full">
                {/* Avatar section */}
                <div className="flex items-start justify-between -mt-12 relative z-10 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <Avatar
                            src={player.avatarUrl || ''}
                            alt={`${player.firstName} ${player.lastName}`}
                            fallbackText={player.firstName?.charAt(0) || 'P'}
                            size="lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mt-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {player.firstName} {player.lastName}
                                </h3>
                                {isVerified && (
                                    <CheckBadgeIcon className="w-5 h-5 text-blue-600" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{primaryPosition}</p>
                        </div>
                    </div>

                    {currentUserId && currentUserId !== player.id && (
                        <div className="flex-shrink-0 mt-2">
                            <FollowButton targetId={player.id} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {/* Bio - min height for consistency */}
                    <div className="min-h-[2.5rem]">
                        {player.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {player.bio}
                            </p>
                        )}
                    </div>

                    {/* Sport & Location Row */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700">{mainSport}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{location}</span>
                        </div>
                    </div>

                    {/* Stats row: Goals + Category - min height for alignment */}
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {lastSeasonGoals !== null && (
                            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs">
                                <TrophyIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-blue-900 font-semibold">{lastSeasonGoals} goal</span>
                            </div>
                        )}
                        {lastSeasonCategory && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-800">
                                {lastSeasonCategory}
                            </span>
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${player.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {player.availability || 'Non specificato'}
                        </span>
                    </div>
                </div>

                {/* View Profile Button */}
                <button
                    onClick={handleProfileClick}
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                    Visualizza Profilo
                </button>
            </div>
        </div>
    )
}
