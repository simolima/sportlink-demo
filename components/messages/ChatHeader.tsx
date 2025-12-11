'use client'

import { ArrowLeft, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface Props {
    peerId: string
    peerName: string | null
    peerAvatar: string | null
    peerRole?: string | null
    onBack?: () => void
    showBackButton?: boolean
}

/**
 * ChatHeader - Header della chat stile LinkedIn
 * 
 * - Avatar grande del contatto
 * - Nome e ruolo
 * - Link profilo
 * - Pulsante indietro (mobile)
 * - Menu azioni (placeholder)
 */
export default function ChatHeader({
    peerId,
    peerName,
    peerAvatar,
    peerRole,
    onBack,
    showBackButton = false
}: Props) {
    const displayName = peerName || 'Utente'
    const initial = displayName[0]?.toUpperCase() || 'U'

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
                {/* Pulsante Indietro (mobile) */}
                {showBackButton && onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Avatar */}
                <Link href={`/profile/${peerId}`} className="flex-shrink-0">
                    {peerAvatar ? (
                        <img
                            src={peerAvatar}
                            alt={displayName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2341F0] to-[#3B52F5] flex items-center justify-center text-white font-semibold text-lg">
                            {initial}
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="min-w-0">
                    <Link
                        href={`/profile/${peerId}`}
                        className="font-semibold text-gray-900 hover:text-[#2341F0] transition-colors truncate block"
                    >
                        {displayName}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                        {peerRole || 'Utente Sprinta'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Link profilo */}
                <Link
                    href={`/profile/${peerId}`}
                    className="hidden sm:inline-flex text-sm text-[#2341F0] hover:text-[#3B52F5] font-medium transition-colors"
                >
                    Vedi profilo
                </Link>

                {/* Menu azioni */}
                <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Altre azioni"
                >
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
    )
}
