'use client'

import { ConversationSummary } from '@/lib/types'
import clsx from 'clsx'

interface Props {
    conversation: ConversationSummary
    peerName: string | null
    peerAvatar: string | null
    isSelected: boolean
    onClick: () => void
}

/**
 * ConversationListItem - Riga conversazione stile LinkedIn
 * 
 * - Avatar con iniziale fallback
 * - Nome contatto
 * - Preview ultimo messaggio (troncato)
 * - Data/ora ultimo messaggio
 * - Badge non letti
 * - Hover e selezione evidenziati
 */
export default function ConversationListItem({
    conversation,
    peerName,
    peerAvatar,
    isSelected,
    onClick
}: Props) {
    const displayName = peerName || 'Utente'
    const initial = displayName[0]?.toUpperCase() || 'U'
    const hasUnread = conversation.unread > 0

    // Formatta data/ora
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
            return 'Ieri'
        } else if (diffDays < 7) {
            return date.toLocaleDateString('it-IT', { weekday: 'short' })
        } else {
            return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        }
    }

    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative',
                isSelected
                    ? 'bg-[#EEF1F7]'
                    : 'bg-white hover:bg-gray-50',
                'border-b border-gray-100'
            )}
        >
            {/* Barra selezione sinistra */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2341F0] rounded-r" />
            )}

            {/* Avatar */}
            <div className="flex-shrink-0 relative">
                {peerAvatar ? (
                    <img
                        src={peerAvatar}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-lg">
                        {initial}
                    </div>
                )}

                {/* Badge non letti su avatar */}
                {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#2341F0] rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                            {conversation.unread > 9 ? '9+' : conversation.unread}
                        </span>
                    </div>
                )}
            </div>

            {/* Contenuto */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    {/* Nome */}
                    <span className={clsx(
                        'truncate text-[15px]',
                        hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    )}>
                        {displayName}
                    </span>

                    {/* Orario */}
                    <span className={clsx(
                        'text-xs flex-shrink-0',
                        hasUnread ? 'text-[#2341F0] font-medium' : 'text-gray-400'
                    )}>
                        {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                </div>

                {/* Preview messaggio */}
                <p className={clsx(
                    'text-sm truncate mt-0.5',
                    hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                )}>
                    {conversation.lastMessage.text}
                </p>
            </div>
        </button>
    )
}
