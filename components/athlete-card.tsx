"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

interface AthleteCardProps {
    athlete: any
    currentUserId: string | null
}

export default function AthleteCard({ athlete, currentUserId }: AthleteCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${athlete.id}`)
    }

    const primaryPosition = athlete.experiences?.[0]?.primaryPosition || athlete.level || 'Atleta'
    const mainSport = Array.isArray(athlete.sports) && athlete.sports.length > 0
        ? athlete.sports[0]
        : athlete.sport || 'Sport'

    const location = athlete.city || athlete.country || 'Non specificato'
    const isVerified = athlete.verified === true

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
            {/* Header card with background */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-20" />

            {/* Avatar section + content */}
            <div className="px-4 pb-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="-mt-12 relative z-10">
                            <Avatar
                                src={athlete.avatarUrl || ''}
                                alt={`${athlete.firstName} ${athlete.lastName}`}
                                fallbackText={athlete.firstName?.charAt(0) || 'A'}
                                size="lg"
                            />
                        </div>
                        <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {athlete.firstName} {athlete.lastName}
                                </h3>
                                {isVerified && (
                                    <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{primaryPosition}</p>
                        </div>
                    </div>

                    {/* Follow button */}
                    {currentUserId && currentUserId !== athlete.id && (
                        <div className="flex-shrink-0">
                            <FollowButton targetId={athlete.id} />
                        </div>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-3 flex-1">
                    {/* Bio - min height for consistency */}
                    <div className="min-h-[2.5rem]">
                        {athlete.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {athlete.bio}
                            </p>
                        )}
                    </div>

                    {/* Info row: Sport & Location */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700">{mainSport}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{location}</span>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${athlete.availability === 'Disponibile'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {athlete.availability || 'Non specificato'}
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
