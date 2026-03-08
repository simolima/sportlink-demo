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
        <div className="flex items-center justify-between px-4 py-3 glass-widget-header border-b border-base-300/70">
            <div className="flex items-center gap-3">
                {/* Pulsante Indietro (mobile) */}
                {showBackButton && onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-secondary hover:text-white hover:bg-base-300/60 rounded-full transition-colors lg:hidden"
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
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-base-300/60"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-semibold text-lg">
                            {initial}
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="min-w-0">
                    <Link
                        href={`/profile/${peerId}`}
                        className="font-semibold text-white hover:text-primary transition-colors truncate block"
                    >
                        {displayName}
                    </Link>
                    <p className="text-sm glass-subtle-text truncate">
                        {peerRole || 'Utente Sprinta'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Link profilo */}
                <Link
                    href={`/profile/${peerId}`}
                    className="hidden sm:inline-flex text-sm text-primary hover:text-brand-700 font-medium transition-colors"
                >
                    Vedi profilo
                </Link>

                {/* Menu azioni */}
                <button
                    className="p-2 text-secondary/60 hover:text-white hover:bg-base-300/60 rounded-full transition-colors"
                    title="Altre azioni"
                >
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
    )
}
