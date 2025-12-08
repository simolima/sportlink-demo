'use client'
import { PencilSquareIcon, MapPinIcon, LanguageIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import Avatar from './avatar'
import StatBox from './stat-box'

interface ProfileHeaderProps {
    user: any
    followersCount?: number
    followingCount?: number
    onEditClick?: () => void
}

export default function ProfileHeader({ user, followersCount, followingCount, onEditClick }: ProfileHeaderProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {/* Header with avatar and info */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Left: Avatar */}
                <div className="flex flex-col items-center md:items-start flex-shrink-0">
                    <Avatar
                        src={user?.avatarUrl}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        size="xl"
                        fallbackText={user?.firstName?.[0] || 'U'}
                        className="w-24 h-24 md:w-28 md:h-28"
                    />
                </div>

                {/* Center: Name, role, info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {user?.firstName} {user?.lastName}
                        </h1>
                        {user?.verified && (
                            <CheckBadgeIcon className="w-7 h-7 text-green-600 mx-auto md:mx-0" />
                        )}
                    </div>

                    <p className="text-lg font-medium text-green-600 mb-2">
                        {user?.currentRole || user?.professionalRole}
                    </p>

                    {/* Location e Languages */}
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-gray-600 mb-3">
                        {user?.city && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{user.city}</span>
                            </div>
                        )}
                        {user?.languages && user.languages.length > 0 && (
                            <div className="flex items-center gap-1">
                                <LanguageIcon className="w-4 h-4" />
                                <span>{user.languages.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    {user?.bio && (
                        <p className="text-gray-700 text-sm md:text-base mb-4">{user.bio}</p>
                    )}

                    {/* Statistiche in barra orizzontale */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <StatBox label="Annunci attivi" value={user?.annunciAttivi ?? 0} />
                        <StatBox label="Candidature ricevute" value={user?.candidatureRicevute ?? 0} />
                        <StatBox label="Followers" value={followersCount ?? user?.followers ?? 0} />
                    </div>
                </div>

                {/* Right: Edit button removed - edit happens in profile-content */}
            </div>
        </div>
    )
}
