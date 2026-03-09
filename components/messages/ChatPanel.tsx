'use client'

import { Message, ReactionType } from '@/lib/types'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageBubble, { BubbleMessage } from './MessageBubble'
import MessageInput, { ReplyingTo } from './MessageInput'
import ForwardMessageModal from './ForwardMessageModal'
import MultiForwardBar from './MultiForwardBar'
import { MessageSquare, ArrowDown } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase-browser'
import { playNotificationSound, getSoundVariant } from '@/lib/notification-sound'
import SprintaLoader from '@/components/ui/SprintaLoader'
import { GroupConversationSummary } from '@/lib/types'

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
    groups?: GroupConversationSummary[]
    onBack?: () => void
    showBackButton?: boolean
}

export default function ChatPanel({
    peerId,
    currentUserId,
    users,
    groups = [],
    onBack,
    showBackButton = false
}: Props) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sendError, setSendError] = useState<string | null>(null)
    const [isPeerTyping, setIsPeerTyping] = useState(false)
    // Scroll state
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null)
    const [showScrollDown, setShowScrollDown] = useState(false)
    // Reply / edit / forward
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null)
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [editingMsg, setEditingMsg] = useState<Message | null>(null)
    const [forwardMsg, setForwardMsg] = useState<BubbleMessage | null>(null)
    // Multi-forward selection mode
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set())
    const [multiForwardItems, setMultiForwardItems] = useState<{ id: string; text: string | null; isGroup: boolean }[] | null>(null)

    const bottomRef = useRef<HTMLDivElement>(null)
    const unreadRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const isFirstLoadRef = useRef(true)
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTypingSentRef = useRef<number>(0)

    const peer = users.find(u => String(u.id) === String(peerId))
    const peerName = peer ? `${peer.firstName || ''} ${peer.lastName || ''}`.trim() || peer.email || null : null
    const peerAvatar = peer?.avatarUrl || null
    const peerRole = peer?.currentRole || null

    // Reset scroll flag when peer changes
    useEffect(() => {
        isFirstLoadRef.current = true
        setFirstUnreadId(null)
        setReplyingTo(null)
        setReplyingToId(null)
        setEditingMsg(null)
    }, [peerId])

    // Fetch messages
    useEffect(() => {
        if (!peerId || !currentUserId) { setMessages([]); return }

        const fetchMessages = async () => {
            setLoading(true)
            setError(null)
            try {
                const authHeaders = await getAuthHeaders()
                const res = await fetch(`/api/messages?userId=${currentUserId}&peerId=${peerId}`, { headers: authHeaders })
                const data = await res.json()
                const msgs: Message[] = Array.isArray(data.messages) ? data.messages : (Array.isArray(data) ? data : [])
                setMessages(msgs)
                setFirstUnreadId(data.firstUnreadMessageId ?? null)

                await fetch('/api/messages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({ userId: currentUserId, peerId })
                })
            } catch {
                setError('Errore nel caricamento messaggi')
            } finally {
                setLoading(false)
            }
        }
        fetchMessages()
    }, [peerId, currentUserId])

    // Auto-scroll: useLayoutEffect fires before paint — no visible scroll jump
    useLayoutEffect(() => {
        if (loading) return
        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false
            if (firstUnreadId && unreadRef.current) {
                unreadRef.current.scrollIntoView({ behavior: 'instant' })
            } else {
                bottomRef.current?.scrollIntoView({ behavior: 'instant' })
            }
            return
        }
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isPeerTyping, loading, firstUnreadId])

    // Scroll position to show/hide the "jump to bottom" button
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return
        const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        setShowScrollDown(distFromBottom > 150)
    }, [])

    // Realtime INSERT
    useEffect(() => {
        if (!peerId || !currentUserId) return
        const channel = supabase
            .channel(`chat:${currentUserId}:${peerId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages',
                filter: `receiver_id=eq.${currentUserId}`,
            }, (payload: { new: Record<string, any> }) => {
                const raw = payload.new
                if (String(raw.sender_id) !== String(peerId)) return
                const incoming: Message = {
                    id: raw.id, senderId: raw.sender_id, receiverId: raw.receiver_id,
                    text: raw.content, timestamp: raw.created_at, read: raw.is_read,
                    editedAt: null, isDeletedForAll: false, forwardedFrom: raw.is_forwarded || !!raw.forwarded_from_id, reactions: [],
                    replyTo: raw.reply_to_id ? { id: raw.reply_to_id, senderName: 'Utente', text: '(caricamento...)' } : undefined,
                }
                setMessages(prev => prev.some(m => String(m.id) === String(incoming.id)) ? prev : [...prev, incoming])
                setIsPeerTyping(false)
                playNotificationSound(getSoundVariant('message_received'))
                getAuthHeaders().then(authHeaders => {
                    fetch('/api/messages', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ userId: currentUserId, peerId }),
                    }).catch(() => { })
                })
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [peerId, currentUserId])

    // Realtime UPDATE (edit, delete, read receipt)
    useEffect(() => {
        if (!peerId || !currentUserId) return
        const channel = supabase
            .channel(`chat-updates:${currentUserId}:${peerId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'messages',
            }, (payload: { new: Record<string, any> }) => {
                const raw = payload.new
                const involved = String(raw.sender_id) === String(currentUserId) || String(raw.receiver_id) === String(currentUserId)
                const inConv = (String(raw.sender_id) === String(peerId) || String(raw.receiver_id) === String(peerId))
                if (!involved || !inConv) return
                setMessages(prev => prev.map(m => String(m.id) === String(raw.id) ? {
                    ...m,
                    text: raw.is_deleted_for_all ? null : raw.content,
                    read: raw.is_read,
                    editedAt: raw.edited_at ?? null,
                    isDeletedForAll: raw.is_deleted_for_all ?? false,
                } : m))
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [peerId, currentUserId])

    // Typing channel
    useEffect(() => {
        if (!peerId || !currentUserId) return
        const channelId = `typing:${[currentUserId, peerId].sort().join(':')}`
        const channel = supabase
            .channel(channelId)
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
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        }
    }, [peerId, currentUserId])

    const broadcastTyping = useCallback(() => {
        const now = Date.now()
        if (now - lastTypingSentRef.current < 2000) return
        lastTypingSentRef.current = now
        typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserId } }).catch(() => { })
    }, [currentUserId])

    const handleSend = async (text: string) => {
        if (!peerId || !currentUserId) return
        const tempId = `temp-${Date.now()}`
        const optimistic: Message = {
            id: tempId, senderId: currentUserId, receiverId: peerId, text, timestamp: new Date().toISOString(), read: false,
            editedAt: null, isDeletedForAll: false, forwardedFrom: replyingToId ? false : false, reactions: [],
            replyTo: replyingTo ? { id: replyingToId!, senderName: replyingTo.senderName, text: replyingTo.text ?? '' } : undefined,
        }
        setSendError(null)
        setMessages(prev => [...prev, optimistic])
        const savedReplyId = replyingToId
        setReplyingTo(null)
        setReplyingToId(null)

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ senderId: currentUserId, receiverId: peerId, text, replyToId: savedReplyId }),
            })
            const newMsg = await res.json()
            if (newMsg?.id) {
                setMessages(prev => prev.map(m => String(m.id) === tempId ? newMsg : m))
            } else {
                setMessages(prev => prev.filter(m => String(m.id) !== tempId))
                setSendError('Impossibile inviare il messaggio. Riprova.')
            }
        } catch {
            setMessages(prev => prev.filter(m => String(m.id) !== tempId))
            setSendError('Errore di rete durante l\'invio del messaggio')
        }
    }

    const handleEditSend = async (text: string) => {
        if (!editingMsg) { await handleSend(text); return }
        const id = editingMsg.id
        setEditingMsg(null)
        try {
            const headers = await getAuthHeaders()
            await fetch('/api/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ messageId: id, senderId: currentUserId, newText: text }),
            })
            setMessages(prev => prev.map(m => String(m.id) === String(id) ? { ...m, text, editedAt: new Date().toISOString() } : m))
        } catch { setSendError('Errore durante la modifica') }
    }

    const handleDeleteForAll = async (id: string) => {
        try {
            const headers = await getAuthHeaders()
            await fetch('/api/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ messageId: id, userId: currentUserId, scope: 'for_all' }),
            })
            setMessages(prev => prev.map(m => String(m.id) === String(id) ? { ...m, text: null, isDeletedForAll: true } : m))
        } catch { setSendError('Errore eliminazione') }
    }

    const handleDeleteForMe = async (id: string) => {
        try {
            const headers = await getAuthHeaders()
            await fetch('/api/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ messageId: id, userId: currentUserId, scope: 'for_me' }),
            })
            setMessages(prev => prev.filter(m => String(m.id) !== String(id)))
        } catch { setSendError('Errore eliminazione') }
    }

    const handleReact = async (messageId: string, reaction: ReactionType) => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ reaction }),
            })
            const result = await res.json()
            setMessages(prev => prev.map(m => {
                if (String(m.id) !== String(messageId)) return m
                const existing = (m.reactions || []).find(r => r.type === reaction)
                if (result.toggled === 'removed') {
                    return { ...m, reactions: (m.reactions || []).map(r => r.type !== reaction ? r : { ...r, count: r.count - 1, hasMyReaction: false }).filter(r => r.count > 0) }
                }
                if (existing) {
                    return { ...m, reactions: (m.reactions || []).map(r => r.type !== reaction ? r : { ...r, count: r.count + 1, hasMyReaction: true }) }
                }
                return { ...m, reactions: [...(m.reactions || []), { type: reaction, count: 1, hasMyReaction: true, users: [{ userId: currentUserId, name: 'Tu' }] }] }
            }))
        } catch { /* silent */ }
    }

    const groupMessagesByDay = (msgs: Message[]) => {
        const groups: { date: string; label: string; messages: Message[] }[] = []
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp)
            const dateKey = date.toDateString()
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            let label: string
            if (dateKey === today.toDateString()) label = 'Oggi'
            else if (dateKey === yesterday.toDateString()) label = 'Ieri'
            else label = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
            const last = groups[groups.length - 1]
            if (last && last.date === dateKey) last.messages.push(msg)
            else groups.push({ date: dateKey, label, messages: [msg] })
        })
        return groups
    }

    if (!peerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-base-200/35 text-center p-8">
                <div className="w-20 h-20 bg-base-300/70 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={40} className="text-secondary/60" />
                </div>
                <h3 className="text-xl font-semibold text-base-content mb-2">I tuoi messaggi</h3>
                <p className="glass-subtle-text max-w-sm">Seleziona una conversazione dalla lista per iniziare a chattare, oppure avvia una nuova chat.</p>
            </div>
        )
    }

    const messageGroups = groupMessagesByDay(messages)

    return (
        <div className="flex-1 flex flex-col bg-transparent h-full">
            <ChatHeader
                peerId={peerId} peerName={peerName} peerAvatar={peerAvatar}
                peerRole={peerRole} onBack={onBack} showBackButton={showBackButton}
            />

            {/* Messages area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 bg-base-200/35 relative"
            >
                {/* Jump-to-bottom button */}
                {showScrollDown && (
                    <button
                        onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-4 right-4 z-10 btn btn-circle btn-sm btn-primary shadow-lg"
                        aria-label="Vai ai messaggi piÃ¹ recenti"
                    >
                        <ArrowDown size={16} />
                    </button>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <SprintaLoader size="md" color="brand" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-error">{error}</div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="glass-subtle-text">Nessun messaggio ancora.</p>
                        <p className="text-sm glass-quiet-text mt-1">Scrivi il primo messaggio!</p>
                    </div>
                ) : (
                    messageGroups.map(group => (
                        <div key={group.date}>
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-base-300/80" />
                                <span className="text-xs text-secondary/60 font-medium uppercase">{group.label}</span>
                                <div className="flex-1 h-px bg-base-300/80" />
                            </div>
                            {group.messages.map(msg => {
                                const isFirstUnread = msg.id === firstUnreadId
                                return (
                                    <div key={msg.id}>
                                        {isFirstUnread && (
                                            <div ref={unreadRef} className="flex items-center gap-3 my-3">
                                                <div className="flex-1 h-px bg-primary/30" />
                                                <span className="text-xs text-primary font-medium">Non letti</span>
                                                <div className="flex-1 h-px bg-primary/30" />
                                            </div>
                                        )}
                                        <MessageBubble
                                            message={msg}
                                            isMine={String(msg.senderId) === String(currentUserId)}
                                            showAvatar={String(msg.senderId) !== String(currentUserId)}
                                            senderName={peerName}
                                            senderAvatar={peerAvatar}
                                            currentUserId={currentUserId}
                                            selectionMode={selectionMode}
                                            isSelected={selectedMsgIds.has(String(msg.id))}
                                            onToggleSelect={id => setSelectedMsgIds(prev => {
                                                const next = new Set(prev)
                                                next.has(id) ? next.delete(id) : next.add(id)
                                                return next
                                            })}
                                            onReply={m => {
                                                setReplyingToId(String(m.id))
                                                setReplyingTo({ senderName: peerName || 'Utente', text: m.text })
                                            }}
                                            onEdit={m => setEditingMsg(m as Message)}
                                            onDeleteForAll={handleDeleteForAll}
                                            onDeleteForMe={handleDeleteForMe}
                                            onForwardSingle={m => setForwardMsg(m)}
                                            onStartMultiForward={m => {
                                                setSelectionMode(true)
                                                setSelectedMsgIds(new Set([String(m.id)]))
                                            }}
                                            onReact={handleReact}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {isPeerTyping && (
                    <div className="flex items-center gap-1.5 px-2 py-2">
                        <span className="text-sm text-secondary/60 italic">{peerName || 'Contatto'} sta scrivendo</span>
                        <div className="flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {sendError && (
                <div className="px-4 py-2 bg-error/10 border-t border-error/30 text-error text-sm">{sendError}</div>
            )}

            {/* Multi-forward bar replaces input while in selection mode */}
            {selectionMode ? (
                <MultiForwardBar
                    count={selectedMsgIds.size}
                    onCancel={() => { setSelectionMode(false); setSelectedMsgIds(new Set()) }}
                    onForward={() => {
                        const msgsToForward = messages
                            .filter(m => selectedMsgIds.has(String(m.id)))
                            .map(m => ({ id: String(m.id), text: m.text, isGroup: false }))
                        setForwardMsg(null)
                        setSelectionMode(false)
                        setSelectedMsgIds(new Set())
                        // Open ForwardMessageModal with all selected messages
                        setMultiForwardItems(msgsToForward)
                    }}
                />
            ) : (
                <MessageInput
                    onSend={editingMsg ? handleEditSend : handleSend}
                    onTyping={broadcastTyping}
                    replyingTo={replyingTo}
                    onCancelReply={() => { setReplyingTo(null); setReplyingToId(null) }}
                    placeholder={editingMsg ? `Modifica: ${editingMsg.text || ''}` : 'Scrivi un messaggio...'}
                />
            )}

            {/* Single forward modal */}
            {forwardMsg && (
                <ForwardMessageModal
                    currentUserId={currentUserId}
                    message={{ id: String(forwardMsg.id), text: forwardMsg.text, isGroup: false }}
                    groups={groups}
                    onClose={() => setForwardMsg(null)}
                />
            )}

            {/* Multi-forward modal */}
            {multiForwardItems && multiForwardItems.length > 0 && (
                <ForwardMessageModal
                    currentUserId={currentUserId}
                    message={multiForwardItems[0]}
                    messages={multiForwardItems}
                    groups={groups}
                    onClose={() => setMultiForwardItems(null)}
                />
            )}
        </div>
    )
}
