'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GroupConversationSummary, GroupMessage, GroupMember, ReactionType } from '@/lib/types'
import GroupChatHeader from './GroupChatHeader'
import MessageBubble, { BubbleMessage } from './MessageBubble'
import MessageInput, { ReplyingTo } from './MessageInput'
import ManageGroupModal from './ManageGroupModal'
import ForwardMessageModal from './ForwardMessageModal'
import MultiForwardBar from './MultiForwardBar'
import { ArrowDown } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase-browser'
import { playNotificationSound, getSoundVariant } from '@/lib/notification-sound'
import SprintaLoader from '@/components/ui/SprintaLoader'

interface Props {
    groupId: string
    currentUserId: string
    groups: GroupConversationSummary[]
    onBack?: () => void
    showBackButton?: boolean
    onGroupDeleted: (groupId: string) => void
}

export default function GroupChatPanel({
    groupId, currentUserId, groups, onBack, showBackButton = false, onGroupDeleted
}: Props) {
    const [messages, setMessages] = useState<GroupMessage[]>([])
    const [members, setMembers] = useState<GroupMember[]>([])
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const [manageOpen, setManageOpen] = useState(false)
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null)
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [forwardMsg, setForwardMsg] = useState<BubbleMessage | null>(null)
    // Multi-forward selection mode
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set())
    const [multiForwardItems, setMultiForwardItems] = useState<{ id: string; text: string | null; isGroup: boolean }[] | null>(null)

    const bottomRef = useRef<HTMLDivElement>(null)
    const unreadRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isFirstLoadRef = useRef(true)

    const isCurrentUserAdmin = members.find(m => m.userId === currentUserId)?.role === 'admin'

    // Reset on groupId change
    useEffect(() => {
        isFirstLoadRef.current = true
        setFirstUnreadId(null)
        setMessages([])
        setReplyingTo(null)
        setReplyingToId(null)
    }, [groupId])

    // Fetch group detail + messages
    useEffect(() => {
        if (!groupId) return
        setLoading(true)

        Promise.all([
            fetch(`/api/groups/${groupId}`).then(r => r.json()),
            fetch(`/api/groups/${groupId}/messages?userId=${currentUserId}`).then(r => r.json()),
        ]).then(([groupData, messagesData]) => {
            setGroupName(groupData.name || '')
            setMembers(groupData.members || [])
            const msgs: GroupMessage[] = messagesData.messages || []
            setMessages(msgs)
            setFirstUnreadId(messagesData.firstUnreadMessageId ?? null)

            // Batch mark as read
            if (msgs.length > 0) {
                getAuthHeaders().then(headers => {
                    fetch(`/api/groups/${groupId}/reads`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...headers },
                        body: JSON.stringify({ messageIds: msgs.map(m => m.id) }),
                    }).catch(() => { })
                })
            }
        }).catch(() => { }).finally(() => setLoading(false))
    }, [groupId, currentUserId])

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
    }, [messages, loading, firstUnreadId])

    const handleScroll = useCallback(() => {
        const container = scrollRef.current
        if (!container) return
        const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        setShowScrollDown(distFromBottom > 150)
    }, [])

    // Realtime INSERT for group messages
    useEffect(() => {
        if (!groupId) return
        const channel = supabase
            .channel(`group-chat:${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'group_messages',
                filter: `group_id=eq.${groupId}`,
            }, async (payload: { new: Record<string, any> }) => {
                const raw = payload.new
                if (String(raw.sender_id) === String(currentUserId)) return // already added optimistically
                const { data: profile } = await supabase
                    .from('profiles').select('first_name, last_name').eq('id', raw.sender_id).single()
                const senderName = profile
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : 'Utente'
                const incoming: GroupMessage = {
                    id: raw.id, groupId: raw.group_id, senderId: raw.sender_id, senderName,
                    text: raw.content, timestamp: raw.created_at,
                    isDeletedForAll: false, forwardedFrom: false, reactions: [],
                }
                setMessages(prev => prev.some(m => String(m.id) === String(incoming.id)) ? prev : [...prev, incoming])
                playNotificationSound(getSoundVariant('message_received'))
                // Mark as read
                getAuthHeaders().then(headers => {
                    fetch(`/api/groups/${groupId}/reads`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...headers },
                        body: JSON.stringify({ messageIds: [raw.id] }),
                    }).catch(() => { })
                })
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [groupId, currentUserId])

    // Realtime UPDATE (edit, delete)
    useEffect(() => {
        if (!groupId) return
        const channel = supabase
            .channel(`group-updates:${groupId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'group_messages',
                filter: `group_id=eq.${groupId}`,
            }, (payload: { new: Record<string, any> }) => {
                const raw = payload.new
                setMessages(prev => prev.map(m => String(m.id) === String(raw.id) ? {
                    ...m,
                    text: raw.is_deleted_for_all ? null : raw.content,
                    editedAt: raw.edited_at ?? null,
                    isDeletedForAll: raw.is_deleted_for_all ?? false,
                } : m))
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [groupId])

    const handleSend = async (text: string) => {
        const tempId = `temp-${Date.now()}`
        const me = members.find(m => m.userId === currentUserId)
        const senderName = me ? `${me.firstName || ''} ${me.lastName || ''}`.trim() || 'Tu' : 'Tu'
        const optimistic: GroupMessage = {
            id: tempId, groupId, senderId: currentUserId, senderName, text,
            timestamp: new Date().toISOString(), isDeletedForAll: false, forwardedFrom: false, reactions: [],
            replyTo: replyingTo ? { id: replyingToId!, senderName: replyingTo.senderName, text: replyingTo.text ?? '' } : undefined,
        }
        setSendError(null)
        setMessages(prev => [...prev, optimistic])
        const savedReplyId = replyingToId
        setReplyingTo(null)
        setReplyingToId(null)

        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ text, replyToId: savedReplyId }),
            })
            const newMsg = await res.json()
            if (newMsg?.id) {
                setMessages(prev => prev.map(m => String(m.id) === tempId ? { ...m, ...newMsg } : m))
            } else {
                setMessages(prev => prev.filter(m => String(m.id) !== tempId))
                setSendError('Impossibile inviare il messaggio')
            }
        } catch {
            setMessages(prev => prev.filter(m => String(m.id) !== tempId))
            setSendError('Errore di rete')
        }
    }

    const handleDeleteForAll = async (id: string) => {
        try {
            const headers = await getAuthHeaders()
            await fetch(`/api/groups/${groupId}/messages/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ scope: 'for_all' }),
            })
            setMessages(prev => prev.map(m => String(m.id) === String(id) ? { ...m, text: null, isDeletedForAll: true } : m))
        } catch { setSendError('Errore eliminazione') }
    }

    const handleDeleteForMe = async (id: string) => {
        try {
            const headers = await getAuthHeaders()
            await fetch(`/api/groups/${groupId}/messages/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ scope: 'for_me' }),
            })
            setMessages(prev => prev.filter(m => String(m.id) !== String(id)))
        } catch { setSendError('Errore eliminazione') }
    }

    const handleReact = async (messageId: string, reaction: ReactionType) => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/groups/${groupId}/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ reaction }),
            })
            const result = await res.json()
            setMessages(prev => prev.map(m => {
                if (String(m.id) !== String(messageId)) return m
                if (result.toggled === 'removed') {
                    return { ...m, reactions: (m.reactions || []).map(r => r.type !== reaction ? r : { ...r, count: r.count - 1, hasMyReaction: false }).filter(r => r.count > 0) }
                }
                const existing = (m.reactions || []).find(r => r.type === reaction)
                if (existing) return { ...m, reactions: (m.reactions || []).map(r => r.type !== reaction ? r : { ...r, count: r.count + 1, hasMyReaction: true }) }
                return { ...m, reactions: [...(m.reactions || []), { type: reaction, count: 1, hasMyReaction: true, users: [{ userId: currentUserId, name: 'Tu' }] }] }
            }))
        } catch { /* silent */ }
    }

    const groupMessagesByDay = (msgs: GroupMessage[]) => {
        const groups: { date: string; label: string; messages: GroupMessage[] }[] = []
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp)
            const dateKey = date.toDateString()
            const today = new Date()
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
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

    const messageGroups = groupMessagesByDay(messages)

    return (
        <div className="flex-1 flex flex-col bg-transparent h-full">
            <GroupChatHeader
                groupId={groupId}
                groupName={groupName}
                memberCount={members.length}
                isAdmin={isCurrentUserAdmin}
                onBack={onBack}
                showBackButton={showBackButton}
                onManage={() => setManageOpen(true)}
            />

            {/* Messages area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 bg-base-200/35 relative"
            >
                {showScrollDown && (
                    <button
                        onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-4 right-4 z-10 btn btn-circle btn-sm btn-primary shadow-lg"
                        aria-label="Vai ai messaggi più recenti"
                    >
                        <ArrowDown size={16} />
                    </button>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <SprintaLoader size="md" color="brand" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="glass-subtle-text">Nessun messaggio ancora.</p>
                        <p className="text-sm glass-quiet-text mt-1">Scrivi il primo messaggio nel gruppo!</p>
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
                                const isMine = String(msg.senderId) === String(currentUserId)
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
                                            isMine={isMine}
                                            showAvatar={!isMine}
                                            showSenderName={!isMine}
                                            senderName={msg.senderName}
                                            senderColor={msg.senderColor}
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
                                                setReplyingTo({ senderName: msg.senderName || 'Utente', text: m.text })
                                            }}
                                            onEdit={() => { /* group edit not supported */ }}
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
                <div ref={bottomRef} />
            </div>

            {sendError && (
                <div className="px-4 py-2 bg-error/10 border-t border-error/30 text-error text-sm">{sendError}</div>
            )}

            {selectionMode ? (
                <MultiForwardBar
                    count={selectedMsgIds.size}
                    onCancel={() => { setSelectionMode(false); setSelectedMsgIds(new Set()) }}
                    onForward={() => {
                        const msgsToForward = messages
                            .filter(m => selectedMsgIds.has(String(m.id)))
                            .map(m => ({ id: String(m.id), text: m.text, isGroup: true }))
                        setSelectionMode(false)
                        setSelectedMsgIds(new Set())
                        setMultiForwardItems(msgsToForward)
                    }}
                />
            ) : (
                <MessageInput
                    onSend={handleSend}
                    replyingTo={replyingTo}
                    onCancelReply={() => { setReplyingTo(null); setReplyingToId(null) }}
                />
            )}

            {/* Manage group modal */}
            {manageOpen && (
                <ManageGroupModal
                    groupId={groupId}
                    groupName={groupName}
                    members={members}
                    currentUserId={currentUserId}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    onClose={() => setManageOpen(false)}
                    onGroupDeleted={() => onGroupDeleted(groupId)}
                    onMembersUpdated={setMembers}
                />
            )}

            {/* Single forward modal */}
            {forwardMsg && (
                <ForwardMessageModal
                    currentUserId={currentUserId}
                    message={{ id: String(forwardMsg.id), text: forwardMsg.text, isGroup: true }}
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
