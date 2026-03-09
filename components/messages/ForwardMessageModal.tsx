'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Search } from 'lucide-react'
import { GroupConversationSummary } from '@/lib/types'
import { getAuthHeaders } from '@/lib/auth-fetch'
import clsx from 'clsx'

interface User {
    id: string
    firstName?: string
    lastName?: string
    email?: string
}

interface Props {
    currentUserId: string
    message: { id: string; text: string | null; isGroup: boolean }
    groups: GroupConversationSummary[]
    onClose: () => void
    /** Called after successful forward so caller can optionally navigate to destination */
    onForwarded?: (destinationId: string, isGroup: boolean) => void
}

export default function ForwardMessageModal({ currentUserId, message, groups, onClose, onForwarded }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [directUsers, setDirectUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [forwarding, setForwarding] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { inputRef.current?.focus() }, [])

    useEffect(() => {
        if (!searchQuery.trim()) { setDirectUsers([]); return }
        setLoading(true)
        fetch(`/api/users?search=${encodeURIComponent(searchQuery)}&limit=10`)
            .then(r => r.json())
            .then(data => setDirectUsers(Array.isArray(data) ? data.filter((u: any) => String(u.id) !== String(currentUserId)) : []))
            .catch(() => setDirectUsers([]))
            .finally(() => setLoading(false))
    }, [searchQuery, currentUserId])

    const forwardTo = async (targetId: string, isGroup: boolean) => {
        if (!message.text) return
        setForwarding(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            if (isGroup) {
                await fetch(`/api/groups/${targetId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify({ text: message.text, forwardFromId: message.id }),
                })
            } else {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify({
                        senderId: currentUserId,
                        receiverId: targetId,
                        text: message.text,
                        forwardFromId: message.id,
                    }),
                })
            }
            onForwarded?.(targetId, isGroup)
            onClose()
        } catch {
            setError('Errore durante l\'inoltro del messaggio')
        } finally {
            setForwarding(false)
        }
    }

    const displayName = (u: User) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Utente'

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forward-msg-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <div className="glass-widget w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl">
                <div className="glass-widget-header flex items-center justify-between px-5 py-4">
                    <h2 id="forward-msg-title" className="font-semibold text-base-content">Inoltra messaggio</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Preview */}
                    <div className="bg-base-200 rounded-xl px-3 py-2 text-sm text-secondary italic line-clamp-2">
                        {message.text || '(messaggio eliminato)'}
                    </div>

                    {/* Groups */}
                    {groups.length > 0 && (
                        <div>
                            <p className="text-xs text-secondary uppercase tracking-wide mb-1 font-medium">I tuoi gruppi</p>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => forwardTo(g.id, true)}
                                        disabled={forwarding}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-base-200 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                                            {g.name[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm text-base-content truncate">{g.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Direct search */}
                    <div>
                        <p className="text-xs text-secondary uppercase tracking-wide mb-1 font-medium">Invia direttamente</p>
                        <div className="relative mb-2">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cerca utente..."
                                className="input input-sm input-bordered w-full pl-8 bg-base-200"
                            />
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                            {loading && <p className="text-xs text-secondary text-center py-2">Ricerca...</p>}
                            {!loading && directUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => forwardTo(u.id, false)}
                                    disabled={forwarding}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-base-200 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                        {displayName(u)[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-sm text-base-content">{displayName(u)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-error text-xs text-center">{error}</p>}
                </div>
            </div>
        </div>
    )
}
