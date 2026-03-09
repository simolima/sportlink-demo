'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Search, Users } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-fetch'
import clsx from 'clsx'

interface User {
    id: string
    firstName?: string
    lastName?: string
    avatarUrl?: string | null
    email?: string
}

interface Props {
    currentUserId: string
    onClose: () => void
    onCreated: (groupId: string, groupName: string) => void
}

export default function CreateGroupModal({ currentUserId, onClose, onCreated }: Props) {
    const [step, setStep] = useState<'select' | 'name'>('select')
    const [searchQuery, setSearchQuery] = useState('')
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [selected, setSelected] = useState<User[]>([])
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (!searchQuery.trim()) { setAllUsers([]); return }
        setLoading(true)
        const q = encodeURIComponent(searchQuery)
        fetch(`/api/users?search=${q}&limit=20`)
            .then(r => r.json())
            .then(data => setAllUsers(Array.isArray(data) ? data.filter((u: any) => String(u.id) !== String(currentUserId)) : []))
            .catch(() => setAllUsers([]))
            .finally(() => setLoading(false))
    }, [searchQuery, currentUserId])

    const toggle = (user: User) => {
        setSelected(prev =>
            prev.some(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        )
    }

    const handleCreate = async () => {
        if (!groupName.trim() || selected.length === 0) return
        setCreating(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    name: groupName.trim(),
                    memberIds: selected.map(u => u.id),
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Errore creazione gruppo')
            onCreated(data.id, data.name)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setCreating(false)
        }
    }

    const displayName = (u: User) =>
        `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Utente'

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <div className="glass-widget w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="glass-widget-header flex items-center justify-between px-5 py-4">
                    <h2 id="create-group-title" className="font-semibold text-base-content">
                        {step === 'select' ? 'Nuovo gruppo' : 'Nome del gruppo'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                        <X size={18} />
                    </button>
                </div>

                {step === 'select' ? (
                    <div className="p-4 space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cerca utenti da aggiungere..."
                                className="input input-bordered w-full pl-9 text-sm bg-base-200"
                            />
                        </div>

                        {/* Selected chips */}
                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selected.map(u => (
                                    <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full"
                                    >
                                        {displayName(u)}
                                        <button onClick={() => toggle(u)} className="hover:text-primary/60 ml-0.5">
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Results */}
                        <div className="max-h-52 overflow-y-auto space-y-1">
                            {loading && (
                                <p className="text-sm text-secondary text-center py-3">Ricerca...</p>
                            )}
                            {!loading && searchQuery && allUsers.length === 0 && (
                                <p className="text-sm text-secondary text-center py-3">Nessun utente trovato</p>
                            )}
                            {!loading && !searchQuery && (
                                <p className="text-sm text-secondary text-center py-3">Inizia a scrivere per cercare</p>
                            )}
                            {allUsers.map(u => {
                                const isSelected = selected.some(s => s.id === u.id)
                                return (
                                    <button
                                        key={u.id}
                                        onClick={() => toggle(u)}
                                        className={clsx(
                                            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-colors',
                                            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-base-200 text-base-content'
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {displayName(u)[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm">{displayName(u)}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            disabled={selected.length === 0}
                            onClick={() => setStep('name')}
                            className="btn btn-primary w-full btn-sm"
                        >
                            Avanti ({selected.length} selezionati)
                        </button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Selected members summary */}
                        <div className="flex items-center gap-2 text-sm text-secondary">
                            <Users size={15} />
                            <span>{selected.length} partecipanti selezionati</span>
                        </div>

                        <div>
                            <label className="label label-text text-sm mb-1">Nome del gruppo</label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                                placeholder="Es. Team Sprinta, Under 19..."
                                maxLength={100}
                                className="input input-bordered w-full bg-base-200"
                                autoFocus
                            />
                        </div>

                        {error && <p className="text-error text-sm">{error}</p>}

                        <div className="flex gap-2">
                            <button onClick={() => setStep('select')} className="btn btn-ghost btn-sm flex-1">
                                Indietro
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!groupName.trim() || creating}
                                className="btn btn-primary btn-sm flex-1"
                            >
                                {creating ? 'Creazione...' : 'Crea gruppo'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
