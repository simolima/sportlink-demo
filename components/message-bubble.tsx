"use client"
import { Message } from '@/lib/types'
import clsx from 'clsx'

interface Props {
    message: Message
    currentUserId: string | null
}

export default function MessageBubble({ message, currentUserId }: Props) {
    const isMine = currentUserId && String(message.senderId) === String(currentUserId)
    return (
        <div className={clsx('flex mb-2', isMine ? 'justify-end' : 'justify-start')}>
            <div className={clsx('max-w-xs rounded-lg px-3 py-2 text-sm shadow',
                isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800')}
            >
                <p className="whitespace-pre-line break-words">{message.text}</p>
                <div className={clsx('mt-1 text-[10px] flex items-center gap-1', isMine ? 'text-blue-100' : 'text-gray-500')}>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMine && (
                        <span>{message.read ? '✓✓' : '✓'}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
