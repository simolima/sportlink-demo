'use client'

import { ConversationSummary } from '@/lib/types'
import ConversationListItem from './ConversationListItem'
import { MessageSquarePlus, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string | null
}

interface Props {
    conversations: ConversationSummary[]
    users: User[]
    selectedPeerId: string | null
    onSelectConversation: (peerId: string) => void
    onNewChat: () => void
    currentUserId: string
    loading?: boolean
}

/**
 * ConversationList - Lista conversazioni stile LinkedIn
 * 
 * - Header con titolo e pulsante nuova chat
 * - Campo ricerca
 * - Lista conversazioni ordinate per data
 * - Stato loading e vuoto
 */
export default function ConversationList({
    conversations,
    users,
    selectedPeerId,
    onSelectConversation,
    onNewChat,
    currentUserId,
    loading = false
}: Props) {
    const [search, setSearch] = useState('')

    // Helper per ottenere info utente
    const getUserInfo = (peerId: string) => {
        const user = users.find(u => String(u.id) === String(peerId))
        if (!user) return { name: null, avatar: null }
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || null
        return { name, avatar: user.avatarUrl || null }
    }

    // Filtra e ordina conversazioni
    const filteredConversations = useMemo(() => {
        let result = [...conversations]

        // Filtra per ricerca
        if (search.trim()) {
            const searchLower = search.toLowerCase()
            result = result.filter(c => {
                const { name } = getUserInfo(c.peerId)
                const matchName = name?.toLowerCase().includes(searchLower)
                const matchText = c.lastMessage.text.toLowerCase().includes(searchLower)
                return matchName || matchText
            })
        }

        // Ordina per data (più recenti in alto)
        result.sort((a, b) =>
            new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        )

        return result
    }, [conversations, search, users])

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Messaggi</h2>
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-2 bg-[#2341F0] text-white text-sm font-medium rounded-lg hover:bg-[#3B52F5] transition-colors shadow-sm"
                >
                    <MessageSquarePlus size={18} />
                    <span className="hidden sm:inline">Nuova chat</span>
                </button>
            </div>

            {/* Ricerca */}
            <div className="px-4 py-3 border-b border-gray-100">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cerca conversazione..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2341F0]/20 focus:bg-white transition-colors"
                    />
                </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquarePlus size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                            {search ? 'Nessun risultato' : 'Nessuna conversazione'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {search ? 'Prova con altri termini' : 'Inizia una nuova chat!'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const { name, avatar } = getUserInfo(conv.peerId)
                        return (
                            <ConversationListItem
                                key={conv.peerId}
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
