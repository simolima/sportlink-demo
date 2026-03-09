'use client'

import { ConversationSummary, GroupConversationSummary } from '@/lib/types'
import ConversationListItem from './ConversationListItem'
import { MessageSquarePlus, Search, Users } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string | null
}

interface Props {
    conversations: ConversationSummary[]
    groups: GroupConversationSummary[]
    users: User[]
    selectedPeerId: string | null
    selectedGroupId: string | null
    onSelectConversation: (peerId: string) => void
    onSelectGroup: (groupId: string) => void
    onNewChat: () => void
    currentUserId: string
    loading?: boolean
}

type ListItem =
    | { kind: 'direct'; data: ConversationSummary; sortKey: number }
    | { kind: 'group'; data: GroupConversationSummary; sortKey: number }

/**
 * ConversationList - Lista conversazioni stile LinkedIn
 * 
 * - Unifica chat 1-to-1 e gruppi in un'unica lista ordinata per timestamp
 * - Header con titolo e pulsante nuova chat
 * - Campo ricerca
 * - Stato loading e vuoto
 */
export default function ConversationList({
    conversations,
    groups,
    users,
    selectedPeerId,
    selectedGroupId,
    onSelectConversation,
    onSelectGroup,
    onNewChat,
    currentUserId,
    loading = false
}: Props) {
    const [search, setSearch] = useState('')

    // Helper per ottenere info utente
    const getUserInfo = useCallback((peerId: string) => {
        const user = users.find(u => String(u.id) === String(peerId))
        if (!user) return { name: null, avatar: null }
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || null
        return { name, avatar: user.avatarUrl || null }
    }, [users])

    // Merge e ordina conversazioni + gruppi
    const filteredItems = useMemo((): ListItem[] => {
        const searchLower = search.trim().toLowerCase()

        const directItems: ListItem[] = conversations
            .filter(c => {
                if (!searchLower) return true
                const { name } = getUserInfo(c.peerId)
                return name?.toLowerCase().includes(searchLower) ||
                    c.lastMessage?.text?.toLowerCase().includes(searchLower)
            })
            .map(c => ({
                kind: 'direct' as const,
                data: c,
                sortKey: new Date(c.lastMessage?.timestamp || 0).getTime(),
            }))

        const groupItems: ListItem[] = groups
            .filter(g => {
                if (!searchLower) return true
                return g.name.toLowerCase().includes(searchLower) ||
                    g.lastMessage?.text?.toLowerCase().includes(searchLower)
            })
            .map(g => ({
                kind: 'group' as const,
                data: g,
                sortKey: new Date(g.lastMessage?.timestamp || 0).getTime(),
            }))

        return [...directItems, ...groupItems].sort((a, b) => b.sortKey - a.sortKey)
    }, [conversations, groups, search, getUserInfo])

    return (
        <div className="flex flex-col h-full glass-widget">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 glass-widget-header">
                <h2 className="text-xl font-bold text-base-content">Messaggi</h2>
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <MessageSquarePlus size={18} />
                    <span className="hidden sm:inline">Nuova chat</span>
                </button>
            </div>

            {/* Ricerca */}
            <div className="px-4 py-3 border-b border-base-300/70">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/60" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cerca conversazione..."
                        className="w-full pl-10 pr-4 py-2.5 bg-base-300/55 border border-base-300 rounded-lg text-sm text-base-content placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                    />
                </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-16 h-16 bg-base-300/70 rounded-full flex items-center justify-center mb-4">
                            <MessageSquarePlus size={32} className="text-secondary/60" />
                        </div>
                        <p className="text-secondary font-medium">
                            {search ? 'Nessun risultato' : 'Nessuna conversazione'}
                        </p>
                        <p className="text-sm glass-quiet-text mt-1">
                            {search ? 'Prova con altri termini' : 'Inizia una nuova chat!'}
                        </p>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        if (item.kind === 'group') {
                            const g = item.data
                            const preview = g.lastMessage
                                ? `${g.lastMessage.senderName ? g.lastMessage.senderName + ': ' : ''}${g.lastMessage.text ?? ''}`
                                : 'Nessun messaggio'
                            return (
                                <button
                                    key={`group-${g.id}`}
                                    onClick={() => onSelectGroup(g.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-base-300/45 transition-colors border-b border-base-300/60 text-left ${selectedGroupId === g.id ? 'bg-primary/10' : ''}`}
                                >
                                    {/* Group avatar */}
                                    <div className="relative w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-base">
                                            {g.name.slice(0, 2).toUpperCase()}
                                        </span>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-base-300 border border-base-content/10 rounded-full flex items-center justify-center">
                                            <Users size={10} className="text-secondary" />
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-medium text-base-content truncate">{g.name}</span>
                                            {g.lastMessage?.timestamp && (
                                                <span className="text-xs text-secondary/60 flex-shrink-0">
                                                    {new Date(g.lastMessage.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-1 mt-0.5">
                                            <p className="text-sm glass-subtle-text truncate">{preview}</p>
                                            {(g.unread ?? 0) > 0 && (
                                                <span className="flex-shrink-0 ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                                    {g.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        }

                        const conv = item.data
                        const { name, avatar } = getUserInfo(conv.peerId)
                        return (
                            <ConversationListItem
                                key={`direct-${conv.peerId}`}
                                conversation={conv}
                                peerName={name}
                                peerAvatar={avatar}
                                isSelected={selectedPeerId === conv.peerId}
                                onClick={() => onSelectConversation(conv.peerId)}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}
