'use client'

import { Message } from '@/lib/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { MessageSquare } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase-browser'
import { playNotificationSound, getSoundVariant } from '@/lib/notification-sound'
import SprintaLoader from '@/components/ui/SprintaLoader'

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
    const [sendError, setSendError] = useState<string | null>(null)
    const [isPeerTyping, setIsPeerTyping] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTypingSentRef = useRef<number>(0)

    // Info peer
    const peer = users.find(u => String(u.id) === String(peerId))
    const peerName = peer ? `${peer.firstName || ''} ${peer.lastName || ''}`.trim() || peer.email || null : null
    const peerAvatar = peer?.avatarUrl || null
    const peerRole = peer?.currentRole || null

    // Fetch messaggi iniziale
    useEffect(() => {
        if (!peerId || !currentUserId) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            setLoading(true)
            setError(null)
            try {
                const authHeaders = await getAuthHeaders()
                const res = await fetch(`/api/messages?userId=${currentUserId}&peerId=${peerId}`, {
                    headers: authHeaders
                })
                const data = await res.json()
                setMessages(Array.isArray(data) ? data : [])

                // Marca come letti
                await fetch('/api/messages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
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

    // Realtime: messaggi istantanei in ingresso
    useEffect(() => {
        if (!peerId || !currentUserId) return

        const channel = supabase
            .channel(`chat:${currentUserId}:${peerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`,
                },
                (payload: { new: Record<string, any> }) => {
                    const raw = payload.new
                    // Mostra solo i messaggi della conversazione attiva
                    if (String(raw.sender_id) !== String(peerId)) return
                    const incoming: Message = {
                        id: raw.id,
                        senderId: raw.sender_id,
                        receiverId: raw.receiver_id,
                        text: raw.content,
                        timestamp: raw.created_at,
                        read: raw.is_read,
                    }
                    setMessages(prev => {
                        // Evita duplicati (nel caso il mittente riceva il proprio messaggio)
                        if (prev.some(m => String(m.id) === String(incoming.id))) return prev
                        return [...prev, incoming]
                    })
                    // Azzeramento typing indicator quando arriva il messaggio
                    setIsPeerTyping(false)
                    // Suono notifica in-chat
                    playNotificationSound(getSoundVariant('message_received'))
                    // Marca subito come letto nel DB: il receiver è nella chat e ha visto il messaggio
                    getAuthHeaders().then(authHeaders => {
                        fetch('/api/messages', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', ...authHeaders },
                            body: JSON.stringify({ userId: currentUserId, peerId }),
                        }).catch(() => { })
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [peerId, currentUserId])

    // Realtime: doppia spunta istantanea quando il peer legge i nostri messaggi
    useEffect(() => {
        if (!peerId || !currentUserId) return

        const channel = supabase
            .channel(`read-receipts:${currentUserId}:${peerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentUserId}`,
                },
                (payload: { new: Record<string, any> }) => {
                    const raw = payload.new
                    if (String(raw.receiver_id) !== String(peerId)) return
                    if (!raw.is_read) return
                    setMessages(prev =>
                        prev.map(m => String(m.id) === String(raw.id) ? { ...m, read: true } : m)
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [peerId, currentUserId])

    // Typing channel — Supabase Broadcast (zero DB writes, ~50ms latency)
    useEffect(() => {
        if (!peerId || !currentUserId) return

        const typingChannelId = `typing:${[currentUserId, peerId].sort().join(':')}`
        const channel = supabase
            .channel(typingChannelId)
            .on('broadcast', { event: 'typing' }, (payload: { payload: { userId: string } }) => {
                if (String(payload.payload.userId) !== String(peerId)) return
                setIsPeerTyping(true)
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 3000)
            })
            .subscribe()

        typingChannelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            typingChannelRef.current = null
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
            }
        }
    }, [peerId, currentUserId])

    // Throttled broadcast typing — fires at most once every 2s
    const broadcastTyping = useCallback(() => {
        const now = Date.now()
        if (now - lastTypingSentRef.current < 2000) return
        lastTypingSentRef.current = now
        typingChannelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId },
        }).catch(() => { })
    }, [currentUserId])

    // Auto-scroll su nuovi messaggi e quando il peer inizia a scrivere
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isPeerTyping])

    // Invia messaggio
    const handleSend = async (text: string) => {
        if (!peerId || !currentUserId) return

        const tempId = `temp-${Date.now()}`
        const optimisticMessage: Message = {
            id: tempId,
            senderId: currentUserId,
            receiverId: peerId,
            text,
            timestamp: new Date().toISOString(),
            read: false,
        }

        setSendError(null)
        setMessages(prev => [...prev, optimisticMessage])

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ senderId: currentUserId, receiverId: peerId, text })
            })
            const newMsg = await res.json()
            if (newMsg && newMsg.id) {
                setMessages(prev => prev.map(msg => String(msg.id) === tempId ? newMsg : msg))
            } else {
                setMessages(prev => prev.filter(msg => String(msg.id) !== tempId))
                setSendError('Impossibile inviare il messaggio. Riprova.')
            }
        } catch (e) {
            setMessages(prev => prev.filter(msg => String(msg.id) !== tempId))
            setSendError('Errore di rete durante l\'invio del messaggio')
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
            <div className="flex-1 flex flex-col items-center justify-center bg-base-200/35 text-center p-8">
                <div className="w-20 h-20 bg-base-300/70 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={40} className="text-secondary/60" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                    I tuoi messaggi
                </h3>
                <p className="glass-subtle-text max-w-sm">
                    Seleziona una conversazione dalla lista per iniziare a chattare, oppure avvia una nuova chat.
                </p>
            </div>
        )
    }

    const messageGroups = groupMessagesByDay(messages)

    return (
        <div className="flex-1 flex flex-col bg-transparent h-full">
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
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-base-200/35">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <SprintaLoader size="md" color="brand" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-error">
                        {error}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="glass-subtle-text">Nessun messaggio ancora.</p>
                        <p className="text-sm glass-quiet-text mt-1">Scrivi il primo messaggio!</p>
                    </div>
                ) : (
                    messageGroups.map(group => (
                        <div key={group.date}>
                            {/* Separatore giorno */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-base-300/80" />
                                <span className="text-xs text-secondary/60 font-medium uppercase">
                                    {group.label}
                                </span>
                                <div className="flex-1 h-px bg-base-300/80" />
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
                {/* Typing indicator */}
                {isPeerTyping && (
                    <div className="flex items-center gap-1.5 px-2 py-2">
                        <span className="text-sm text-secondary/60 italic">
                            {peerName || 'Contatto'} sta scrivendo
                        </span>
                        <div className="flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            {sendError && (
                <div className="px-4 py-2 bg-error/10 border-t border-error/30 text-error text-sm">
                    {sendError}
                </div>
            )}
            <MessageInput onSend={handleSend} onTyping={broadcastTyping} />
        </div>
    )
}
