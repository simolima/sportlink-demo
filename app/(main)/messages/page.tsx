"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ConversationSummary, GroupConversationSummary } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { ConversationList, ChatPanel, NewChatModal } from '@/components/messages'
import GroupChatPanel from '@/components/messages/GroupChatPanel'
import { getAuthHeaders } from '@/lib/auth-fetch'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string | null
    currentRole?: string
}

/**
 * MessagesPage - Pagina messaggi unificata stile LinkedIn
 * 
 * Layout split view:
 * - Desktop: lista conversazioni (1/3) + chat (2/3) affiancate
 * - Mobile: lista o chat a schermo intero con toggle
 * 
 * URL: /messages?chat=<peerId> per chat diretta
 *      /messages?group=<groupId> per chat di gruppo
 */
export default function MessagesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isLoading: authLoading } = useRequireAuth(false)

    // Stato
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [groups, setGroups] = useState<GroupConversationSummary[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewChatModal, setShowNewChatModal] = useState(false)

    // Responsive: su mobile mostra solo lista o chat
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

    const currentUserId = user?.id ? String(user.id) : null
    const selectedPeerId = searchParams.get('chat')
    const selectedGroupId = searchParams.get('group')

    // Fetch conversazioni 1:1
    const fetchConversations = useCallback(async () => {
        if (!currentUserId) return
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/messages?userId=${currentUserId}`, { headers: authHeaders })
            const data = await res.json()
            setConversations(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Errore caricamento conversazioni:', e)
        }
    }, [currentUserId])

    // Fetch gruppi
    const fetchGroups = useCallback(async () => {
        if (!currentUserId) return
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/groups?userId=${currentUserId}`, { headers: authHeaders })
            const data = await res.json()
            setGroups(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Errore caricamento gruppi:', e)
        }
    }, [currentUserId])

    // Fetch utenti
    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch { /* silent */ }
    }, [])

    // Init
    useEffect(() => {
        if (!currentUserId) return
        setLoading(true)
        Promise.all([fetchConversations(), fetchGroups(), fetchUsers()]).finally(() => setLoading(false))
    }, [fetchConversations, fetchGroups, fetchUsers, currentUserId])

    // Se c'Ã¨ un param nell'URL, mostra la chat su mobile
    useEffect(() => {
        if (selectedPeerId || selectedGroupId) {
            setMobileView('chat')
        }
    }, [selectedPeerId, selectedGroupId])

    // Seleziona conversazione 1:1
    const handleSelectConversation = (peerId: string) => {
        router.push(`/messages?chat=${peerId}`, { scroll: false })
        setMobileView('chat')
        setTimeout(fetchConversations, 500)
    }

    // Seleziona gruppo
    const handleSelectGroup = (groupId: string) => {
        router.push(`/messages?group=${groupId}`, { scroll: false })
        setMobileView('chat')
        setTimeout(fetchGroups, 500)
    }

    // Torna alla lista (mobile)
    const handleBack = () => {
        router.push('/messages', { scroll: false })
        setMobileView('list')
        fetchConversations()
        fetchGroups()
    }

    // Nuova chat diretta
    const handleNewChat = (peerId: string) => {
        setShowNewChatModal(false)
        handleSelectConversation(peerId)
    }

    // Gruppo creato
    const handleGroupCreated = (groupId: string) => {
        setShowNewChatModal(false)
        fetchGroups()
        handleSelectGroup(groupId)
    }

    // Gruppo eliminato
    const handleGroupDeleted = (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId))
        if (selectedGroupId === groupId) {
            router.push('/messages', { scroll: false })
            setMobileView('list')
        }
    }

    // Auth check
    if (authLoading || !user) {
        return (
            <div className="h-[calc(100vh-64px)] glass-page-bg flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!currentUserId) {
        return (
            <div className="h-[calc(100vh-64px)] glass-page-bg flex items-center justify-center">
                <p className="glass-subtle-text">Devi essere loggato per vedere i messaggi.</p>
            </div>
        )
    }

    const existingPeerIds = conversations.map(c => c.peerId)

    return (
        <div className="h-[calc(100vh-64px)] glass-page-bg text-base-content px-3 py-3 md:px-4 md:py-4">
            <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border border-base-300/60 flex">
                {/* Lista conversazioni - Desktop: sempre visibile, Mobile: solo se mobileView === 'list' */}
                <div className={`
                w-full lg:w-[380px] lg:min-w-[320px] lg:max-w-[420px] 
                border-r border-base-300/70 
                ${mobileView === 'list' ? 'block' : 'hidden lg:block'}
            `}>
                    <ConversationList
                        conversations={conversations}
                        groups={groups}
                        users={users}
                        selectedPeerId={selectedPeerId}
                        selectedGroupId={selectedGroupId}
                        onSelectConversation={handleSelectConversation}
                        onSelectGroup={handleSelectGroup}
                        onNewChat={() => setShowNewChatModal(true)}
                        currentUserId={currentUserId}
                        loading={loading}
                    />
                </div>

                {/* Chat / Group Panel - Desktop: sempre visibile, Mobile: solo se mobileView === 'chat' */}
                <div className={`
                flex-1 
                ${mobileView === 'chat' ? 'block' : 'hidden lg:block'}
            `}>
                    {selectedGroupId ? (
                        <GroupChatPanel
                            groupId={selectedGroupId}
                            currentUserId={currentUserId}
                            groups={groups}
                            onBack={handleBack}
                            showBackButton={true}
                            onGroupDeleted={handleGroupDeleted}
                        />
                    ) : (
                        <ChatPanel
                            peerId={selectedPeerId}
                            currentUserId={currentUserId}
                            users={users}
                            groups={groups}
                            onBack={handleBack}
                            showBackButton={true}
                        />
                    )}
                </div>

                {/* Modal nuova chat */}
                {showNewChatModal && (
                    <NewChatModal
                        users={users}
                        currentUserId={currentUserId}
                        existingPeerIds={existingPeerIds}
                        onSelect={handleNewChat}
                        onClose={() => setShowNewChatModal(false)}
                        onGroupCreated={handleGroupCreated}
                    />
                )}
            </div>
        </div>
    )
}
