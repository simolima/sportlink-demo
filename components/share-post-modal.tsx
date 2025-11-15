'use client'
import { useState, useEffect } from 'react'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface SharePostModalProps {
    postId: number
    onClose: () => void
    onShared?: () => void
}

export default function SharePostModal({ postId, onClose, onShared }: SharePostModalProps) {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/users')
                if (res.ok) {
                    const data = await res.json()
                    // Filtra l'utente corrente
                    const filtered = data.filter((u: any) => String(u.id) !== String(currentUserId))
                    setUsers(filtered)
                }
            } catch (e) {
                console.error('Error fetching users:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [currentUserId])

    const filteredUsers = users.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase())
    })

    const handleShare = async () => {
        if (!selectedUserId || !currentUserId) {
            alert('Seleziona un utente')
            return
        }

        setSending(true)
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: selectedUserId,
                    text: '[Post condiviso]',
                    sharedPostId: postId
                })
            })

            if (res.ok) {
                onShared?.()
                onClose()
            } else {
                alert('Errore durante l\'invio')
            }
        } catch (e) {
            console.error('Error sharing post:', e)
            alert('Errore durante l\'invio')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Condividi post</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Cerca utente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* User list */}
                <div className="max-h-80 overflow-y-auto p-4">
                    {loading && <p className="text-gray-500 text-center">Caricamento...</p>}
                    {!loading && filteredUsers.length === 0 && (
                        <p className="text-gray-500 text-center">Nessun utente trovato</p>
                    )}
                    {!loading && filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUserId(String(user.id))}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                                String(selectedUserId) === String(user.id)
                                    ? 'bg-blue-100 border-2 border-blue-500'
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                                {(user.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    {user.firstName || ''} {user.lastName || ''}
                                </p>
                                {user.currentRole && (
                                    <p className="text-xs text-gray-500">{user.currentRole}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={!selectedUserId || sending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        {sending ? 'Invio...' : 'Invia'}
                    </button>
                </div>
            </div>
        </div>
    )
}
