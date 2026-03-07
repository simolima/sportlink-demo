"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FavoriteButton from '@/components/favorite-button'
import VerifyButton from '@/components/verify-button'
import { MapPinIcon, CheckBadgeIcon, BriefcaseIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { SportIcon } from '@/lib/sport-icons'

interface AgentCardProps {
    agent: any
    currentUserId: string | null
}

export default function AgentCard({ agent, currentUserId }: AgentCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${agent.id}`)
    }

    const fullName = `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Agente'
    const mainSport = Array.isArray(agent.sports) && agent.sports.length > 0
        ? agent.sports[0]
        : agent.sport || ''
    const city = agent.city || ''
    const country = agent.country || ''
    const isVerified = agent.verified === true
    const uefaLicenses = Array.isArray(agent.uefaLicenses) ? agent.uefaLicenses : []
    const hasFIFA = agent.hasFifaLicense === true

    return (
        <div
            onClick={handleProfileClick}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col cursor-pointer group"
        >
            <div className="p-5 flex flex-col h-full">
                {/* Top: Avatar + Name + Follow */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar
                        src={agent.avatarUrl || ''}
                        alt={fullName}
                        fallbackText={agent.firstName?.charAt(0) || 'A'}
                        size="lg"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-brand-700 transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">Agente</p>
                    </div>
                    {currentUserId && currentUserId !== agent.id && (
                        <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <FavoriteButton targetId={agent.id} currentUserId={currentUserId} />
                            <VerifyButton targetId={agent.id} currentUserId={currentUserId} />
                        </div>
                    )}
                </div>

                {/* Bio or Agent Notes */}
                {(agent.bio || agent.agentNotes) && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {agent.bio || agent.agentNotes}
                    </p>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                    {mainSport && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 inline-flex items-center gap-1">
                            <SportIcon sport={mainSport} className="w-3 h-3 flex-shrink-0" />
                            {mainSport}
                        </span>
                    )}
                    {uefaLicenses.length > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            <BriefcaseIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            UEFA
                        </span>
                    )}
                    {hasFIFA && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            <BriefcaseIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            FIFA
                        </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${agent.availability === 'Disponibile'
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                        {agent.availability || 'Non specificato'}
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
