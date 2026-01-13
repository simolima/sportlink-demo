"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

interface ProfessionalCardProps {
    professional: any
    currentUserId: string | null
}

export default function ProfessionalCard({ professional, currentUserId }: ProfessionalCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${professional.id}`)
    }

    const mainSport = Array.isArray(professional.sports) && professional.sports.length > 0
        ? professional.sports[0]
        : professional.sport || 'Sport'
    const location = professional.city || professional.country || 'Non specificato'
    const isVerified = professional.verified === true

    // Get role label
    const roleLabel = professional.professionalRole || 'Professionista'

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            {/* Header with green gradient */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-20" />

            {/* Content */}
            <div className="px-4 pb-4 flex flex-col h-full">
                {/* Avatar section */}
                <div className="flex items-start justify-between -mt-12 relative z-10 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <Avatar
                            src={professional.avatarUrl || ''}
                            alt={`${professional.firstName} ${professional.lastName}`}
                            fallbackText={professional.firstName?.charAt(0) || 'P'}
                            size="lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mt-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {professional.firstName} {professional.lastName}
                                </h3>
                                {isVerified && (
                                    <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{roleLabel}</p>
                        </div>
                    </div>

                    {currentUserId && currentUserId !== professional.id && (
                        <div className="flex-shrink-0 mt-2">
                            <FollowButton targetId={professional.id} />
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="space-y-2 mb-4 flex-1">
                    {/* Sport */}
                    <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-medium">{mainSport}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{location}</span>
                    </div>

                    {/* Availability */}
                    {professional.availability && (
                        <div className="mt-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                professional.availability === 'Disponibile'
                                    ? 'bg-green-100 text-green-800'
                                    : professional.availability === 'Valuta proposte'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-gray-100 text-gray-700'
                            }`}>
                                {professional.availability}
                            </span>
                        </div>
                    )}

                    {/* Bio */}
                    {professional.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {professional.bio}
                        </p>
                    )}

                    {/* Certifications preview */}
                    {Array.isArray(professional.certifications) && professional.certifications.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 font-medium">Certificazioni:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {professional.certifications.slice(0, 2).map((cert: any, idx: number) => (
                                    <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                        {typeof cert === 'string' ? cert : (cert.name || cert.title || 'Certificazione')}
                                    </span>
                                ))}
                                {professional.certifications.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                        +{professional.certifications.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleProfileClick}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                    Visualizza Profilo
                </button>
            </div>
        </div>
    )
}
