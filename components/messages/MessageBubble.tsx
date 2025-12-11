'use client'

import { Message } from '@/lib/types'
import clsx from 'clsx'
import { Check, CheckCheck } from 'lucide-react'

interface Props {
    message: Message
    isMine: boolean
    showAvatar?: boolean
    senderName?: string | null
    senderAvatar?: string | null
}

/**
 * MessageBubble - Bolla messaggio stile LinkedIn/professionale
 * 
 * - Messaggi propri: blu Sprinta con testo bianco ad alto contrasto
 * - Messaggi altrui: grigio chiaro con testo scuro
 * - Orario in basso, icona read status per i propri messaggi
 */
export default function MessageBubble({
    message,
    isMine,
    showAvatar = false,
    senderName,
    senderAvatar
}: Props) {
    const time = new Date(message.timestamp).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className={clsx(
            'flex mb-3',
            isMine ? 'justify-end' : 'justify-start'
        )}>
            {/* Avatar per messaggi ricevuti */}
            {!isMine && showAvatar && (
                <div className="mr-2 flex-shrink-0 self-end">
                    {senderAvatar ? (
                        <img
                            src={senderAvatar}
                            alt={senderName || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                            {senderName?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
            )}

            {/* Bolla messaggio */}
            <div className={clsx(
                'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                isMine
                    ? 'bg-[#2341F0] text-white' // Blu Sprinta con testo bianco
                    : 'bg-[#F4F6F9] text-[#1F2933]' // Grigio chiaro con testo scuro
            )}>
                {/* Testo messaggio */}
                <p className={clsx(
                    'text-[15px] leading-relaxed whitespace-pre-wrap break-words',
                    isMine ? 'text-white' : 'text-[#1F2933]'
                )}>
                    {message.text}
                </p>

                {/* Footer: orario + status */}
                <div className={clsx(
                    'flex items-center justify-end gap-1.5 mt-1.5',
                    isMine ? 'text-white/70' : 'text-gray-500'
                )}>
                    <span className="text-[11px]">{time}</span>
                    {isMine && (
                        message.read ? (
                            <CheckCheck size={14} className="text-white/80" />
                        ) : (
                            <Check size={14} className="text-white/60" />
                        )
                    )}
                </div>
            </div>
        </div>
    )
}
