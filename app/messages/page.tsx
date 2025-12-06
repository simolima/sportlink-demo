"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ConversationSummary } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'

export default function MessagesPage() {
    const { user, isLoading: authLoading } = useRequireAuth(true)
    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [users, setUsers] = useState<any[]>([])
    const [showNew, setShowNew] = useState(false)

    const currentUserId = user?.id ? String(user.id) : null

    useEffect(() => {
        const fetchConvos = async () => {
            if (!currentUserId) return
            setLoading(true)
            try {
                const res = await fetch(`/api/messages?userId=${currentUserId}`)
                const data = await res.json()
                setConversations(Array.isArray(data) ? data : [])
                setError(null)
            } catch (e: any) {
                setError('Errore nel caricamento conversazioni')
            } finally {
                setLoading(false)
            }
        }
        fetchConvos()
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users')
                const data = await res.json()
                setUsers(Array.isArray(data) ? data : [])
            } catch { /* silent */ }
        }
        fetchUsers()
    }, [currentUserId])

    const filtered = conversations.filter(c => {
        if (!search.trim()) return true
        const user = users.find(u => String(u.id) === String(c.peerId))
        const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : c.peerId
        return name.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.text.toLowerCase().includes(search.toLowerCase())
    })

    if (authLoading || !user) {
        return null
    }

    if (!currentUserId) {
        return <div className="max-w-4xl mx-auto p-6">Devi essere loggato per vedere i messaggi.</div>
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Messaggi</h1>
                <button onClick={() => setShowNew(v => !v)} className="text-sm px-3 py-1.5 rounded bg-sprinta-blue text-white hover:bg-sprinta-blue-hover">
                    {showNew ? 'Chiudi' : 'Nuova chat'}
                </button>
            </div>
            <div className="mb-4 flex items-center gap-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cerca conversazione..."
                    className="border rounded px-3 py-2 text-sm w-full"
                />
            </div>
            {loading && <div>Caricamento...</div>}
            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
            {!loading && filtered.length === 0 && (
                <div className="text-sm text-gray-500">Nessuna conversazione.</div>
            )}
            <ul className="divide-y bg-white rounded-lg shadow">
                {filtered.map(c => (
                    <li key={c.peerId} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                        <div className="min-w-0">
                            {(() => {
                                const u = users.find(u => String(u.id) === String(c.peerId))
                                const display = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || c.peerId : c.peerId
                                return (
                                    <Link href={`/messages/${c.peerId}`} className="font-medium text-sprinta-blue hover:underline">{display}</Link>
                                )
                            })()}
                            <p className="text-xs text-gray-500 truncate max-w-md mt-1">{c.lastMessage.text}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-400">{new Date(c.lastMessage.timestamp).toLocaleString()}</span>
                            {c.unread > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{c.unread}</span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {showNew && (
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                    <h2 className="font-semibold mb-3 text-sm">Avvia nuova conversazione</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {users
                            .filter(u => String(u.id) !== String(currentUserId))
                            .map(u => {
                                const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id
                                return (
                                    <Link key={u.id} href={`/messages/${u.id}`} className="border rounded p-3 text-sm hover:bg-blue-50 hover:border-sprinta-blue transition-colors">
                                        <div className="font-medium">{name}</div>
                                        <div className="text-xs text-gray-500 truncate">{u.currentRole}</div>
                                    </Link>
                                )
                            })}
                    </div>
                </div>
            )}
        </div>
    )
}
