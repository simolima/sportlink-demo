'use client'
import Avatar from './avatar'
import { CameraIcon } from '@heroicons/react/24/outline'

interface ProfileCoverProps {
    coverUrl?: string
    avatarUrl?: string
    name: string
    isOwn?: boolean
    onCoverUpload?: () => void
}

export default function ProfileCover({ 
    coverUrl, 
    avatarUrl, 
    name, 
    isOwn = false,
    onCoverUpload 
}: ProfileCoverProps) {
    const defaultCover = 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&h=400&fit=crop'
    
    return (
        <div className="relative">
            {/* Cover Photo */}
            <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-blue-500 to-blue-700 overflow-hidden rounded-t-lg">
                <img 
                    src={coverUrl || defaultCover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {isOwn && (
                    <button 
                        onClick={onCoverUpload}
                        className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition"
                    >
                        <CameraIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Modifica copertina</span>
                    </button>
                )}
            </div>
            
            {/* Avatar positioned over the cover */}
            <div className="absolute -bottom-16 left-8 md:left-12">
                <div className="relative">
                    <div className="ring-4 ring-white rounded-full">
                        <Avatar
                            src={avatarUrl}
                            alt={name}
                            fallbackText={name?.[0] || 'U'}
                            className="w-32 h-32 md:w-40 md:h-40"
                        />
                    </div>
                    {isOwn && (
                        <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition">
                            <CameraIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
