"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BuildingOffice2Icon, MagnifyingGlassIcon, MapPinIcon, UserGroupIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { SPORTS, type Club } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'

export default function ClubsPage() {
    const { user, isLoading: authLoading } = useRequireAuth(true)
    const router = useRouter()
    const [clubs, setClubs] = useState<Club[]>([])
    const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedCity, setSelectedCity] = useState('')

    const currentUserId = user?.id ? String(user.id) : null

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/clubs')
            const data = await res.json()
            setClubs(data)
            setFilteredClubs(data)
        } catch (error) {
            console.error('Errore nel caricamento dei club:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let result = clubs

        // Filter by search query
        if (searchQuery) {
            result = result.filter(club =>
                club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                club.city.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by sport
        if (selectedSport !== 'all') {
            result = result.filter(club => club.sports && club.sports.includes(selectedSport as any))
        }

        // Filter by city
        if (selectedCity) {
            result = result.filter(club =>
                club.city.toLowerCase().includes(selectedCity.toLowerCase())
            )
        }

        setFilteredClubs(result)
    }, [searchQuery, selectedSport, selectedCity, clubs])

    const handleClubClick = (clubId: number | string) => {
        router.push(`/clubs/${clubId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sprinta-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Caricamento società...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Società e Club</h1>
                        <p className="text-gray-600">Esplora le società sportive e scopri opportunità di carriera</p>
                    </div>
                    <button
                        onClick={() => router.push('/clubs/create')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <BuildingOffice2Icon className="h-5 w-5" />
                        Crea Società
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cerca società..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                            {SPORTS.map((sport) => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>

                        {/* City Filter */}
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtra per città..."
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        Trovati <span className="font-semibold">{filteredClubs.length}</span> risultati
                    </div>
                </div>

                {/* Clubs Grid */}
                {filteredClubs.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna società trovata</h3>
                        <p className="text-gray-600">Prova a modificare i filtri di ricerca</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClubs.map((club) => (
                            <div
                                key={club.id}
                                onClick={() => handleClubClick(club.id)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                            >
                                {/* Cover Image */}
                                <div className="h-32 bg-sprinta-navy relative">
                                    {club.coverUrl && (
                                        <img
                                            src={club.coverUrl}
                                            alt={club.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {club.verified && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                            ✓ Verificato
                                        </div>
                                    )}
                                </div>

                                {/* Logo */}
                                <div className="px-6 -mt-12 mb-4">
                                    <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                                        {club.logoUrl ? (
                                            <img
                                                src={club.logoUrl}
                                                alt={club.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <BuildingOffice2Icon className="h-10 w-10 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 pb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{club.name}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mb-3">
                                        <MapPinIcon className="h-4 w-4 mr-1" />
                                        {club.city}
                                        {club.sports && club.sports.length > 0 && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span className="text-blue-600 font-medium">{club.sports.join(', ')}</span>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {club.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                                        <div className="flex items-center">
                                            <UserGroupIcon className="h-4 w-4 mr-1" />
                                            {club.followersCount || 0} follower
                                        </div>
                                        <div className="flex items-center">
                                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                                            {club.membersCount || 0} membri
                                        </div>
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
