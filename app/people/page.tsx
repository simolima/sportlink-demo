"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'

export default function PeoplePage() {
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setCurrentUserId(id)

        if (!id) {
            router.push('/login')
            return
        }

        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users')
                const data = await res.json()
                // Escludi l'utente corrente
                const others = (data || []).filter((u: any) => String(u.id) !== String(id))
                setUsers(others)
                setFilteredUsers(others)
            } catch (e) {
                console.error('Error fetching users:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [router])

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = users.filter(u =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.currentRole?.toLowerCase().includes(query) ||
            u.username?.toLowerCase().includes(query)
        )
        setFilteredUsers(filtered)
    }, [searchQuery, users])

    if (!currentUserId) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Scopri persone</h1>
                    <p className="text-gray-600">Trova atleti, coach, dirigenti e inizia a seguirli</p>
                </div>

                {/* Search bar */}
                <div className="mb-6">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cerca per nome, ruolo o email..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Users grid */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Caricamento utenti...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Nessun utente trovato</p>
                        <p className="text-sm text-gray-400">Prova a modificare i filtri di ricerca</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => router.push(`/profile/${user.id}`)}
                                    >
                                        <Avatar
                                            src={user.avatarUrl}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            size="lg"
                                            fallbackText={user.firstName?.[0] || 'U'}
                                            className="w-16 h-16"
                                        />
                                    </div>

                                    {/* User info */}
                                    <div className="flex-1 min-w-0">
                                        <h3
                                            className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-green-600"
                                            onClick={() => router.push(`/profile/${user.id}`)}
                                        >
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        {user.username && (
                                            <p className="text-sm text-gray-500">@{user.username}</p>
                                        )}
                                        <p className="text-green-600 font-medium text-sm mt-1">{user.currentRole}</p>
                                        {user.bio && (
                                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{user.bio}</p>
                                        )}
                                    </div>

                                    {/* Follow button */}
                                    <div className="flex-shrink-0">
                                        <FollowButton targetId={user.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
