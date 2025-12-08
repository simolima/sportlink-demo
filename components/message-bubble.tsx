"use client"
import { Message } from '@/lib/types'
import Avatar from './avatar'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

interface Props {
    message: Message
    currentUserId: string | null
}

export default function MessageBubble({ message, currentUserId }: Props) {
    const isMine = currentUserId && String(message.senderId) === String(currentUserId)
    const [senderAvatar, setSenderAvatar] = useState<string | null>(null)
    const [senderName, setSenderName] = useState<string | null>(null)

    useEffect(() => {
        const fetchSender = async () => {
            try {
                const res = await fetch('/api/users')
                if (res.ok) {
                    const users = await res.json()
                    const sender = users.find((u: any) => String(u.id) === String(message.senderId))
                    setSenderAvatar(sender?.avatarUrl || null)
                    setSenderName(sender ? `${sender.firstName} ${sender.lastName}` : null)
                }
            } catch { }
        }
        if (!isMine) fetchSender()
    }, [message.senderId, isMine])

    return (
        <div className={clsx('flex mb-2', isMine ? 'justify-end' : 'justify-start')}>
            {!isMine && (
                <div className="mr-2 flex-shrink-0">
                    <Avatar
                        src={senderAvatar}
                        alt={senderName || 'User'}
                        size="sm"
                        fallbackText={senderName?.[0] || 'U'}
                    />
                </div>
            )}
            <div className={clsx('max-w-xs rounded-lg px-3 py-2 text-sm shadow',
                isMine ? 'bg-sprinta-blue text-white' : 'bg-gray-100 text-gray-800')
            }>
                <p className="whitespace-pre-line break-words">{message.text}</p>

                <div className={clsx('mt-1 text-[10px] flex items-center gap-1', isMine ? 'text-sprinta-text/70' : 'text-sprinta-text-secondary')}>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMine && (
                        <span>{message.read ? '✓✓' : '✓'} </span>
                    )}
                </div>
            </div>
        </div>
    )
}
