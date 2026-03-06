"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { MapPinIcon, CheckBadgeIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface ProfessionalCardProps {
    professional: any
    currentUserId: string | null
}

export default function ProfessionalCard({ professional, currentUserId }: ProfessionalCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${professional.id}`)
    }

    const fullName = `${professional.firstName || ''} ${professional.lastName || ''}`.trim() || 'Professionista'
    const mainSport = Array.isArray(professional.sports) && professional.sports.length > 0
        ? professional.sports[0]
        : professional.sport || ''
    const city = professional.city || ''
    const country = professional.country || ''
    const isVerified = professional.verified === true
    const roleLabel = professional.professionalRole || 'Professionista'

    return (
        <div
            onClick={handleProfileClick}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col cursor-pointer group"
        >
            <div className="p-5 flex flex-col h-full">
                {/* Top: Avatar + Name + Follow */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar
                        src={professional.avatarUrl || ''}
                        alt={fullName}
                        fallbackText={professional.firstName?.charAt(0) || 'P'}
                        size="lg"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-brand-700 transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-brand-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{roleLabel}</p>
                    </div>
                    {currentUserId && currentUserId !== professional.id && (
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <FollowButton targetId={professional.id} />
                        </div>
                    )}
                </div>

                {/* Bio */}
                {professional.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {professional.bio}
                    </p>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                    {mainSport && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                            {mainSport}
                        </span>
                    )}
                    {Array.isArray(professional.certifications) && professional.certifications.slice(0, 2).map((cert: any, idx: number) => (
                        <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {typeof cert === 'string' ? cert : (cert.name || cert.title || 'Cert.')}
                        </span>
                    ))}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${professional.availability === 'Disponibile'
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : professional.availability === 'Valuta proposte'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                        {professional.availability || 'Non specificato'}
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
