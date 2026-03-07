"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, AcademicCapIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { SportIcon } from '@/lib/sport-icons'

interface CoachCardProps {
    coach: any
    currentUserId: string | null
}

export default function CoachCard({ coach, currentUserId }: CoachCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${coach.id}`)
    }

    const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || 'Allenatore'
    const mainSport = Array.isArray(coach.sports) && coach.sports.length > 0
        ? coach.sports[0]
        : coach.sport || ''
    const city = coach.city || ''
    const country = coach.country || ''
    const isVerified = coach.verified === true
    const uefaLicenses = Array.isArray(coach.uefaLicenses) ? coach.uefaLicenses : []

    return (
        <div
            onClick={handleProfileClick}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col cursor-pointer group"
        >
            <div className="p-5 flex flex-col h-full">
                {/* Top: Avatar + Name + Follow */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar
                        src={coach.avatarUrl || ''}
                        alt={fullName}
                        fallbackText={coach.firstName?.charAt(0) || 'A'}
                        size="lg"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-brand-700 transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-purple-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Allenatore{coach.coachSpecializations ? ` · ${coach.coachSpecializations}` : ''}
                        </p>
                    </div>
                    {currentUserId && currentUserId !== coach.id && (
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <FollowButton targetId={coach.id} />
                        </div>
                    )}
                </div>

                {/* Bio */}
                {coach.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {coach.bio}
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
                    {uefaLicenses.length > 0 && uefaLicenses.slice(0, 2).map((license: string, idx: number) => (
                        <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                            <AcademicCapIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            {license}
                        </span>
                    ))}
                    {uefaLicenses.length > 2 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                            +{uefaLicenses.length - 2}
                        </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${coach.availability === 'Disponibile'
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                        {coach.availability || 'Non specificato'}
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
