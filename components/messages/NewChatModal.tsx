'use client'

import { X, Search, Users } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import CreateGroupModal from './CreateGroupModal'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string | null
    currentRole?: string
}

interface Props {
    users: User[]
    currentUserId: string
    existingPeerIds: string[]
    onSelect: (userId: string) => void
    onClose: () => void
    onGroupCreated?: (groupId: string, groupName: string) => void
}

/**
 * NewChatModal - Modale per avviare nuova chat
 * 
 * - Lista utenti filtrabili
 * - Esclude utente corrente e conversazioni esistenti (opzionale)
 * - Avatar con iniziale fallback
 */
export default function NewChatModal({
    users,
    currentUserId,
    existingPeerIds,
    onSelect,
    onClose,
    onGroupCreated,
}: Props) {
    const [search, setSearch] = useState('')
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const availableUsers = useMemo(() => {
        return users
            .filter(u => String(u.id) !== String(currentUserId))
            .filter(u => {
                if (!search.trim()) return true
                const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
                const email = (u.email || '').toLowerCase()
                const role = (u.currentRole || '').toLowerCase()
                const searchLower = search.toLowerCase()
                return name.includes(searchLower) || email.includes(searchLower) || role.includes(searchLower)
            })
    }, [users, currentUserId, search])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-chat-title"
                className="glass-widget rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="glass-widget-header flex items-center justify-between px-4 py-3 border-b border-base-300/70">
                    <h3 id="new-chat-title" className="text-lg font-semibold text-base-content">Nuova conversazione</h3>
                    <button
                        onClick={onClose}
                        aria-label="Chiudi modale nuova conversazione"
                        className="p-2 text-secondary hover:text-base-content hover:bg-base-300/60 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Crea gruppo CTA */}
                <div className="px-4 pt-3 pb-2 border-b border-base-300/70">
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                    >
                        <span className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <Users size={18} className="text-primary" />
                        </span>
                        Nuovo gruppo
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
                            placeholder="Cerca utente..."
                            className="w-full pl-10 pr-4 py-2.5 bg-base-300/55 border border-base-300 rounded-lg text-sm text-base-content placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Lista utenti */}
                <div className="flex-1 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="glass-subtle-text">Nessun utente trovato</p>
                        </div>
                    ) : (
                        availableUsers.map(user => {
                            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Utente'
                            const initial = name[0]?.toUpperCase() || 'U'
                            const hasExistingChat = existingPeerIds.includes(String(user.id))

                            return (
                                <button
                                    key={user.id}
                                    onClick={() => onSelect(String(user.id))}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-300/45 transition-colors border-b border-base-300/60 text-left"
                                >
                                    {/* Avatar */}
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={name}
                                            className="w-11 h-11 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-semibold">
                                            {initial}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-base-content truncate">{name}</span>
                                            {hasExistingChat && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-base-300/80 text-secondary rounded">
                                                    Chat esistente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm glass-subtle-text truncate">
                                            {user.currentRole || 'Utente Sprinta'}
                                        </p>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {showCreateGroup && (
                <CreateGroupModal
                    currentUserId={currentUserId}
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(groupId, groupName) => {
                        setShowCreateGroup(false)
                        onClose()
                        onGroupCreated?.(groupId, groupName)
                    }}
                />
            )}
        </div>
    )
}
