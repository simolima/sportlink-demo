"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { SUPPORTED_SPORTS, PROFESSIONAL_ROLES } from '@/lib/types'

export default function PeoplePage() {
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedRole, setSelectedRole] = useState('all')
    const [selectedAvailability, setSelectedAvailability] = useState('all')
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
        let result = users

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(u =>
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.currentRole?.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query) ||
                u.bio?.toLowerCase().includes(query)
            )
        }

        // Sport filter
        if (selectedSport !== 'all') {
            result = result.filter(u => u.sport === selectedSport)
        }

        // Role filter
        if (selectedRole !== 'all') {
            result = result.filter(u => u.professionalRole === selectedRole)
        }

        // Availability filter
        if (selectedAvailability !== 'all') {
            result = result.filter(u => u.availability === selectedAvailability)
        }

        setFilteredUsers(result)
    }, [searchQuery, selectedSport, selectedRole, selectedAvailability, users])

    if (!currentUserId) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Scopri persone</h1>
                    <p className="text-gray-600">Trova atleti, coach, dirigenti e inizia a seguirli</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search bar */}
                        <div className="relative md:col-span-2">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cerca per nome, ruolo o bio..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Sport Filter */}
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="all">Tutti gli sport</option>
                            {SUPPORTED_SPORTS.map((sport) => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>

                        {/* Role Filter */}
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="all">Tutti i ruoli</option>
                            {PROFESSIONAL_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Availability Filter */}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => setSelectedAvailability('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAvailability === 'all'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tutti
                        </button>
                        <button
                            onClick={() => setSelectedAvailability('Disponibile')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAvailability === 'Disponibile'
                                ? 'bg-sprinta-primary text-sprinta-text'
                                : 'bg-sprinta-card text-sprinta-text-secondary hover:bg-sprinta-card-hover'
                                }`}
                        >
                            Disponibile
                        </button>
                        <button
                            onClick={() => setSelectedAvailability('Valuta proposte')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAvailability === 'Valuta proposte'
                                ? 'bg-sprinta-primary text-sprinta-text'
                                : 'bg-sprinta-card text-sprinta-text-secondary hover:bg-sprinta-card-hover'
                                }`}
                        >
                            Valuta proposte
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        Trovati <span className="font-semibold">{filteredUsers.length}</span> risultati
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
                                            className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-sprinta-blue"
                                            onClick={() => router.push(`/profile/${user.id}`)}
                                        >
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        {user.username && (
                                            <p className="text-sm text-gray-500">@{user.username}</p>
                                        )}

                                        {/* Sport & Role */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {user.professionalRole && (
                                                <span className="text-sprinta-blue font-medium text-sm">{user.professionalRole}</span>
                                            )}
                                            {user.professionalRole && user.sport && <span className="text-gray-400">•</span>}
                                            {user.sport && (
                                                <span className="text-gray-600 text-sm">{user.sport}</span>
                                            )}
                                        </div>

                                        {/* City & Availability */}
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            {user.city && (
                                                <div className="flex items-center">
                                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                                    {user.city}
                                                </div>
                                            )}
                                            {user.availability && (
                                                <>
                                                    {user.city && <span>•</span>}
                                                    <span className={`font-medium ${user.availability === 'Disponibile' ? 'text-sprinta-blue' :
                                                        user.availability === 'Valuta proposte' ? 'text-blue-600' :
                                                            'text-gray-500'
                                                        }`}>
                                                        {user.availability}
                                                    </span>
                                                </>
                                            )}
                                        </div>

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
