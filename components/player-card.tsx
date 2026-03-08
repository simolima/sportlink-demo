"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FavoriteButton from '@/components/favorite-button'
import VerifyButton from '@/components/verify-button'
import { MapPinIcon, CheckBadgeIcon, TrophyIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { SportIcon } from '@/lib/sport-icons'

interface PlayerCardProps {
    player: any
    currentUserId: string | null
    canRequestAffiliation?: boolean
    affiliationStatus?: 'none' | 'pending' | 'active'
    onRequestAffiliation?: (playerId: string) => Promise<void> | void
    requestingAffiliation?: boolean
}

export default function PlayerCard({
    player,
    currentUserId,
    canRequestAffiliation = false,
    affiliationStatus = 'none',
    onRequestAffiliation,
    requestingAffiliation = false,
}: PlayerCardProps) {
    const router = useRouter()
    const canAffiliationAction = canRequestAffiliation && !!currentUserId && String(currentUserId) !== String(player.id)

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
            className="glass-widget rounded-xl border border-base-300/70 overflow-hidden hover:border-primary/35 transition-all duration-200 h-full flex flex-col cursor-pointer group"
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
                            <h3 className="font-semibold text-base text-white truncate group-hover:text-primary transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm glass-subtle-text mt-0.5">
                            Giocatore{primaryPosition ? ` · ${primaryPosition}` : ''}
                        </p>
                    </div>
                    {currentUserId && currentUserId !== player.id && (
                        <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <FavoriteButton targetId={player.id} currentUserId={currentUserId} />
                            <VerifyButton targetId={player.id} currentUserId={currentUserId} />
                        </div>
                    )}
                </div>

                {/* Bio */}
                {player.bio && (
                    <p className="text-sm glass-subtle-text line-clamp-2 mb-3">
                        {player.bio}
                    </p>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                    {mainSport && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 inline-flex items-center gap-1">
                            <SportIcon sport={mainSport} className="w-3 h-3 flex-shrink-0" />
                            {mainSport}
                        </span>
                    )}
                    {lastSeasonCategory && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-base-300/70 text-secondary border border-base-300">
                            {lastSeasonCategory}
                        </span>
                    )}
                    {lastSeasonGoals !== null && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                            <TrophyIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            {lastSeasonGoals} goal
                        </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${player.availability === 'Disponibile'
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-base-300/70 text-secondary/70 border border-base-300'
                        }`}>
                        {player.availability || 'Non specificato'}
                    </span>
                </div>

                {/* Location & Country footer */}
                {(city || country) && (
                    <div className="flex items-center gap-3 text-xs glass-quiet-text mt-3 pt-3 border-t border-base-300/70">
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

                {canAffiliationAction && (
                    <div className="mt-3 pt-3 border-t border-base-300/70" onClick={(e) => e.stopPropagation()}>
                        {affiliationStatus === 'none' && (
                            <button
                                onClick={() => onRequestAffiliation?.(String(player.id))}
                                disabled={requestingAffiliation}
                                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {requestingAffiliation ? 'Invio in corso...' : 'Richiedi Affiliazione'}
                            </button>
                        )}

                        {affiliationStatus === 'pending' && (
                            <div className="w-full py-2 bg-warning/10 text-warning border border-warning/30 text-sm font-semibold rounded-lg text-center">
                                Richiesta in attesa
                            </div>
                        )}

                        {affiliationStatus === 'active' && (
                            <div className="w-full py-2 bg-primary/10 text-primary border border-primary/30 text-sm font-semibold rounded-lg text-center">
                                Affiliato
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
