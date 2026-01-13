"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

interface AgentCardProps {
    agent: any
    currentUserId: string | null
}

export default function AgentCard({ agent, currentUserId }: AgentCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${agent.id}`)
    }

    const mainSport = Array.isArray(agent.sports) && agent.sports.length > 0
        ? agent.sports[0]
        : agent.sport || 'Sport'
    const location = agent.city || agent.country || 'Non specificato'
    const isVerified = agent.verified === true
    const uefaLicenses = Array.isArray(agent.uefaLicenses) ? agent.uefaLicenses : []
    const hasFIFA = agent.hasFifaLicense === true

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            {/* Header with gradient for Agents */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-20" />

            {/* Content */}
            <div className="px-4 pb-4 flex flex-col h-full">
                {/* Avatar section */}
                <div className="flex items-start justify-between -mt-12 relative z-10 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <Avatar
                            src={agent.avatarUrl || ''}
                            alt={`${agent.firstName} ${agent.lastName}`}
                            fallbackText={agent.firstName?.charAt(0) || 'A'}
                            size="lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mt-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {agent.firstName} {agent.lastName}
                                </h3>
                                {isVerified && (
                                    <CheckBadgeIcon className="w-5 h-5 text-amber-600" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">Agente</p>
                        </div>
                    </div>

                    {currentUserId && currentUserId !== agent.id && (
                        <div className="flex-shrink-0 mt-2">
                            <FollowButton targetId={agent.id} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {/* Bio - min height for consistency */}
                    <div className="min-h-[2.5rem]">
                        {agent.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {agent.bio}
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

                    {/* Licenses - UEFA & FIFA - min height for alignment */}
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {uefaLicenses.length > 0 && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-xs">
                                <BriefcaseIcon className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-amber-900 font-semibold">UEFA</span>
                            </div>
                        )}
                        {hasFIFA && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-xs">
                                <BriefcaseIcon className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-amber-900 font-semibold">FIFA</span>
                            </div>
                        )}
                        {uefaLicenses.length === 0 && !hasFIFA && (
                            <span className="text-xs text-gray-500 italic">Nessuna licenza registrata</span>
                        )}
                    </div>

                    {/* Agent Notes - min height for consistency */}
                    <div className="min-h-[2.5rem]">
                        {agent.agentNotes && (
                            <p className="text-xs text-gray-600 line-clamp-2 italic">
                                "{agent.agentNotes}"
                            </p>
                        )}
                    </div>

                    {/* Availability */}
                    <div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${agent.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {agent.availability || 'Non specificato'}
                        </span>
                    </div>
                </div>

                {/* View Profile Button */}
                <button
                    onClick={handleProfileClick}
                    className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                    Visualizza Profilo
                </button>
            </div>
        </div>
    )
}
