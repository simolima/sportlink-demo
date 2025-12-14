"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ConversationSummary } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { ConversationList, ChatPanel, NewChatModal } from '@/components/messages'

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
 * URL: /messages?chat=<peerId> per deep linking
 */
export default function MessagesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isLoading: authLoading } = useRequireAuth(false)

    // Stato
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewChatModal, setShowNewChatModal] = useState(false)

    // Responsive: su mobile mostra solo lista o chat
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

    const currentUserId = user?.id ? String(user.id) : null
    const selectedPeerId = searchParams.get('chat')

    // Fetch conversazioni
    const fetchConversations = useCallback(async () => {
        if (!currentUserId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/messages?userId=${currentUserId}`)
            const data = await res.json()
            setConversations(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Errore caricamento conversazioni:', e)
        } finally {
            setLoading(false)
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
        fetchConversations()
        fetchUsers()
    }, [fetchConversations, fetchUsers])

    // Se c'è un peerId nell'URL, mostra la chat su mobile
    useEffect(() => {
        if (selectedPeerId) {
            setMobileView('chat')
        }
    }, [selectedPeerId])

    // Seleziona conversazione
    const handleSelectConversation = (peerId: string) => {
        router.push(`/messages?chat=${peerId}`, { scroll: false })
        setMobileView('chat')
        // Refresh conversazioni per aggiornare unread
        setTimeout(fetchConversations, 500)
    }

    // Torna alla lista (mobile)
    const handleBack = () => {
        router.push('/messages', { scroll: false })
        setMobileView('list')
        fetchConversations()
    }

    // Nuova chat
    const handleNewChat = (peerId: string) => {
        setShowNewChatModal(false)
        handleSelectConversation(peerId)
    }

    // Auth check
    if (authLoading || !user) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!currentUserId) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center">
                <p className="text-gray-500">Devi essere loggato per vedere i messaggi.</p>
            </div>
        )
    }

    const existingPeerIds = conversations.map(c => c.peerId)

    return (
        <div className="h-[calc(100vh-64px)] flex bg-gray-100">
            {/* Lista conversazioni - Desktop: sempre visibile, Mobile: solo se mobileView === 'list' */}
            <div className={`
                w-full lg:w-[380px] lg:min-w-[320px] lg:max-w-[420px] 
                border-r border-gray-200 
                ${mobileView === 'list' ? 'block' : 'hidden lg:block'}
            `}>
                <ConversationList
                    conversations={conversations}
                    users={users}
                    selectedPeerId={selectedPeerId}
                    onSelectConversation={handleSelectConversation}
                    onNewChat={() => setShowNewChatModal(true)}
                    currentUserId={currentUserId}
                    loading={loading}
                />
            </div>

            {/* Chat Panel - Desktop: sempre visibile, Mobile: solo se mobileView === 'chat' */}
            <div className={`
                flex-1 
                ${mobileView === 'chat' ? 'block' : 'hidden lg:block'}
            `}>
                <ChatPanel
                    peerId={selectedPeerId}
                    currentUserId={currentUserId}
                    users={users}
                    onBack={handleBack}
                    showBackButton={true}
                />
            </div>

            {/* Modal nuova chat */}
            {showNewChatModal && (
                <NewChatModal
                    users={users}
                    currentUserId={currentUserId}
                    existingPeerIds={existingPeerIds}
                    onSelect={handleNewChat}
                    onClose={() => setShowNewChatModal(false)}
                />
            )}
        </div>
    )
}
