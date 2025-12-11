'use client'

import { Message } from '@/lib/types'
import { useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { MessageSquare } from 'lucide-react'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string | null
    currentRole?: string
}

interface Props {
    peerId: string | null
    currentUserId: string
    users: User[]
    onBack?: () => void
    showBackButton?: boolean
}

/**
 * ChatPanel - Pannello chat completo stile LinkedIn
 * 
 * - Header con info contatto
 * - Lista messaggi con scroll automatico
 * - Separatori di giorno
 * - Input messaggio moderno
 * - Stato placeholder se nessuna chat selezionata
 */
export default function ChatPanel({
    peerId,
    currentUserId,
    users,
    onBack,
    showBackButton = false
}: Props) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Info peer
    const peer = users.find(u => String(u.id) === String(peerId))
    const peerName = peer ? `${peer.firstName || ''} ${peer.lastName || ''}`.trim() || peer.email || null : null
    const peerAvatar = peer?.avatarUrl || null
    const peerRole = peer?.currentRole || null

    // Fetch messaggi
    useEffect(() => {
        if (!peerId || !currentUserId) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/messages?userId=${currentUserId}&peerId=${peerId}`)
                const data = await res.json()
                setMessages(Array.isArray(data) ? data : [])

                // Marca come letti
                await fetch('/api/messages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId, peerId })
                })
            } catch (e) {
                setError('Errore nel caricamento messaggi')
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()
    }, [peerId, currentUserId])

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Invia messaggio
    const handleSend = async (text: string) => {
        if (!peerId || !currentUserId) return

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: currentUserId, receiverId: peerId, text })
            })
            const newMsg = await res.json()
            if (newMsg && newMsg.id) {
                setMessages(prev => [...prev, newMsg])
            }
        } catch (e) {
            // Silenzioso per ora
        }
    }

    // Raggruppa messaggi per giorno
    const groupMessagesByDay = (msgs: Message[]) => {
        const groups: { date: string; label: string; messages: Message[] }[] = []

        msgs.forEach(msg => {
            const date = new Date(msg.timestamp)
            const dateKey = date.toDateString()
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            let label: string
            if (dateKey === today.toDateString()) {
                label = 'Oggi'
            } else if (dateKey === yesterday.toDateString()) {
                label = 'Ieri'
            } else {
                label = date.toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })
            }

            const lastGroup = groups[groups.length - 1]
            if (lastGroup && lastGroup.date === dateKey) {
                lastGroup.messages.push(msg)
            } else {
                groups.push({ date: dateKey, label, messages: [msg] })
            }
        })

        return groups
    }

    // Placeholder se nessuna chat selezionata
    if (!peerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBFC] text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    I tuoi messaggi
                </h3>
                <p className="text-gray-500 max-w-sm">
                    Seleziona una conversazione dalla lista per iniziare a chattare, oppure avvia una nuova chat.
                </p>
            </div>
        )
    }

    const messageGroups = groupMessagesByDay(messages)

    return (
        <div className="flex-1 flex flex-col bg-white h-full">
            {/* Header */}
            <ChatHeader
                peerId={peerId}
                peerName={peerName}
                peerAvatar={peerAvatar}
                peerRole={peerRole}
                onBack={onBack}
                showBackButton={showBackButton}
            />

            {/* Area messaggi */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#FAFBFC]">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                        {error}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-gray-500">Nessun messaggio ancora.</p>
                        <p className="text-sm text-gray-400 mt-1">Scrivi il primo messaggio!</p>
                    </div>
                ) : (
                    messageGroups.map(group => (
                        <div key={group.date}>
                            {/* Separatore giorno */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium uppercase">
                                    {group.label}
                                </span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Messaggi del giorno */}
                            {group.messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isMine={String(msg.senderId) === String(currentUserId)}
                                    showAvatar={String(msg.senderId) !== String(currentUserId)}
                                    senderName={peerName}
                                    senderAvatar={peerAvatar}
                                />
                            ))}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={handleSend} />
        </div>
    )
}
