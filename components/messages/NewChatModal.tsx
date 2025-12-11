'use client'

import { X, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

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
    onClose
}: Props) {
    const [search, setSearch] = useState('')

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Nuova conversazione</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
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
                            placeholder="Cerca utente..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2341F0]/20 focus:bg-white transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Lista utenti */}
                <div className="flex-1 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-gray-500">Nessun utente trovato</p>
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
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                                >
                                    {/* Avatar */}
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={name}
                                            className="w-11 h-11 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold">
                                            {initial}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{name}</span>
                                            {hasExistingChat && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                                    Chat esistente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {user.currentRole || 'Utente Sprinta'}
                                        </p>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
