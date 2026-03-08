"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'
import FavoriteButton from '@/components/favorite-button'
import VerifyButton from '@/components/verify-button'
import { MapPinIcon, CheckBadgeIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { SportIcon } from '@/lib/sport-icons'

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
            className="glass-widget rounded-xl border border-base-300/70 overflow-hidden hover:border-primary/35 transition-all duration-200 h-full flex flex-col cursor-pointer group"
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
                            <h3 className="font-semibold text-base text-white truncate group-hover:text-primary transition-colors">
                                {fullName}
                            </h3>
                            {isVerified && (
                                <CheckBadgeIcon className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm glass-subtle-text mt-0.5">{roleLabel}</p>
                    </div>
                    {currentUserId && currentUserId !== professional.id && (
                        <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <FavoriteButton targetId={professional.id} currentUserId={currentUserId} />
                            <VerifyButton targetId={professional.id} currentUserId={currentUserId} />
                        </div>
                    )}
                </div>

                {/* Bio */}
                {professional.bio && (
                    <p className="text-sm glass-subtle-text line-clamp-2 mb-3">
                        {professional.bio}
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
                    {Array.isArray(professional.certifications) && professional.certifications.slice(0, 2).map((cert: any, idx: number) => (
                        <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-full bg-base-300/70 text-secondary border border-base-300">
                            {typeof cert === 'string' ? cert : (cert.name || cert.title || 'Cert.')}
                        </span>
                    ))}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${professional.availability === 'Disponibile'
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : professional.availability === 'Valuta proposte'
                            ? 'bg-warning/10 text-warning border border-warning/30'
                            : 'bg-base-300/70 text-secondary/70 border border-base-300'
                        }`}>
                        {professional.availability || 'Non specificato'}
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
            </div>
        </div>
    )
}
