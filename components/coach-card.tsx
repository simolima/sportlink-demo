"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

interface CoachCardProps {
    coach: any
    currentUserId: string | null
}

export default function CoachCard({ coach, currentUserId }: CoachCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${coach.id}`)
    }

    const mainSport = Array.isArray(coach.sports) && coach.sports.length > 0
        ? coach.sports[0]
        : coach.sport || 'Sport'
    const location = coach.city || coach.country || 'Non specificato'
    const isVerified = coach.verified === true
    const uefaLicenses = Array.isArray(coach.uefaLicenses) ? coach.uefaLicenses : []

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            {/* Header with gradient for Coaches */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-20" />

            {/* Content */}
            <div className="px-4 pb-4 flex flex-col h-full">
                {/* Avatar section */}
                <div className="flex items-start justify-between -mt-12 relative z-10 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <Avatar
                            src={coach.avatarUrl || ''}
                            alt={`${coach.firstName} ${coach.lastName}`}
                            fallbackText={coach.firstName?.charAt(0) || 'A'}
                            size="lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mt-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {coach.firstName} {coach.lastName}
                                </h3>
                                {isVerified && (
                                    <CheckBadgeIcon className="w-5 h-5 text-purple-600" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">Allenatore</p>
                        </div>
                    </div>

                    {currentUserId && currentUserId !== coach.id && (
                        <div className="flex-shrink-0 mt-2">
                            <FollowButton targetId={coach.id} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {/* Bio - min height for consistency */}
                    <div className="min-h-[2.5rem]">
                        {coach.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {coach.bio}
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

                    {/* UEFA Licenses - min height for alignment */}
                    <div className="min-h-[2rem]">
                        {uefaLicenses.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {uefaLicenses.slice(0, 2).map((license: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 py-1 rounded text-xs">
                                        <AcademicCapIcon className="w-3.5 h-3.5 text-purple-600" />
                                        <span className="text-purple-900 font-semibold">{license}</span>
                                    </div>
                                ))}
                                {uefaLicenses.length > 2 && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-800">
                                        +{uefaLicenses.length - 2} licenze
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Specialization */}
                    {coach.coachSpecializations && (
                        <div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-800">
                                {coach.coachSpecializations}
                            </span>
                        </div>
                    )}

                    {/* Availability */}
                    <div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${coach.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {coach.availability || 'Non specificato'}
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
