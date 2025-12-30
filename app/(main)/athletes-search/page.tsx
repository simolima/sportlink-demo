"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import AthleteCard from '@/components/athlete-card'
import FilterBar from '@/components/athletes-filter-bar'

export default function AthletesSearchPage() {
    const router = useRouter()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedPosition, setSelectedPosition] = useState('all')
    const [selectedCity, setSelectedCity] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [selectedAvailability, setSelectedAvailability] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [verified, setVerified] = useState(false)

    // Data & Loading states
    const [athletes, setAthletes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [total, setTotal] = useState(0)

    // Pagination
    const [offset, setOffset] = useState(0)
    const [limit] = useState(12)
    const [hasMore, setHasMore] = useState(false)

    // Auth check & initial load
    useEffect(() => {
        if (typeof window === 'undefined') return

        const userId = localStorage.getItem('currentUserId')
        if (!userId) {
            router.push('/login')
            return
        }
        setCurrentUserId(userId)
    }, [router])

    // Fetch athletes based on filters
    const fetchAthletes = useCallback(async (newOffset = 0) => {
        if (!currentUserId) return

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                ...(searchTerm && { searchTerm }),
                ...(selectedSport !== 'all' && { sport: selectedSport }),
                ...(selectedPosition !== 'all' && { position: selectedPosition }),
                ...(selectedCity && { city: selectedCity }),
                ...(selectedCountry && { country: selectedCountry }),
                ...(selectedAvailability !== 'all' && { availability: selectedAvailability }),
                ...(selectedLevel !== 'all' && { level: selectedLevel }),
                ...(verified && { verified: 'true' }),
                limit: limit.toString(),
                offset: newOffset.toString(),
            })

            const response = await fetch(`/api/search/athletes?${params}`)
            if (!response.ok) throw new Error('Failed to fetch athletes')

            const data = await response.json()
            setAthletes(data.data || [])
            setTotal(data.total || 0)
            setHasMore(data.hasMore || false)
            setOffset(newOffset)
        } catch (err) {
            console.error('Search error:', err)
            setError('Errore nel caricamento degli atleti. Riprova.')
            setAthletes([])
        } finally {
            setLoading(false)
        }
    }, [currentUserId, searchTerm, selectedSport, selectedPosition, selectedCity, selectedCountry, selectedAvailability, selectedLevel, verified, limit])

    // Fetch when filters change
    useEffect(() => {
        if (currentUserId) {
            fetchAthletes(0)
        }
    }, [searchTerm, selectedSport, selectedPosition, selectedCity, selectedCountry, selectedAvailability, selectedLevel, verified, currentUserId, fetchAthletes])

    if (!currentUserId) return null

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <SparklesIcon className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Trova Atleti
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Scopri talenti in base a sport, ruolo, location e disponibilità
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Filters */}
                    <div className="lg:col-span-1">
                        <FilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedSport={selectedSport}
                            onSportChange={setSelectedSport}
                            selectedPosition={selectedPosition}
                            onPositionChange={setSelectedPosition}
                            selectedCity={selectedCity}
                            onCityChange={setSelectedCity}
                            selectedCountry={selectedCountry}
                            onCountryChange={setSelectedCountry}
                            selectedAvailability={selectedAvailability}
                            onAvailabilityChange={setSelectedAvailability}
                            selectedLevel={selectedLevel}
                            onLevelChange={setSelectedLevel}
                            verified={verified}
                            onVerifiedChange={setVerified}
                        />
                    </div>

                    {/* Main Content - Results */}
                    <div className="lg:col-span-3">
                        {/* Results Info */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {total} atleti trovati
                            </h2>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                {error}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && athletes.length === 0 && (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin">
                                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full" />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && athletes.length === 0 && !error && (
                            <div className="text-center py-16">
                                <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Nessun atleta trovato
                                </h3>
                                <p className="text-gray-600">
                                    Prova a cambiare i criteri di ricerca
                                </p>
                            </div>
                        )}

                        {/* Athletes Grid */}
                        {athletes.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {athletes.map((athlete) => (
                                        <AthleteCard
                                            key={athlete.id}
                                            athlete={athlete}
                                            currentUserId={currentUserId}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => fetchAthletes(Math.max(0, offset - limit))}
                                        disabled={offset === 0 || loading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                    >
                                        Precedenti
                                    </button>

                                    <span className="text-sm text-gray-600 font-medium">
                                        {offset + 1} - {Math.min(offset + limit, total)} di {total}
                                    </span>

                                    <button
                                        onClick={() => fetchAthletes(offset + limit)}
                                        disabled={!hasMore || loading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                    >
                                        Successivi
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
