"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'
import PlayerCard from '@/components/player-card'
import CoachCard from '@/components/coach-card'
import AgentCard from '@/components/agent-card'
import DynamicFilterBar from '@/components/dynamic-filter-bar'

export default function ProfessionalsPage() {
    const router = useRouter()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Basic Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [roleType, setRoleType] = useState('all')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedPosition, setSelectedPosition] = useState('all')
    const [selectedCity, setSelectedCity] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [selectedAvailability, setSelectedAvailability] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [verified, setVerified] = useState(false)

    // Player-specific filters
    const [minGoals, setMinGoals] = useState<number | null>(null)
    const [category, setCategory] = useState('all')

    // Coach-specific filters
    const [uefaLicense, setUefaLicense] = useState('all')
    const [specialization, setSpecialization] = useState('')

    // Agent-specific filters
    const [hasUEFALicense, setHasUEFALicense] = useState('all')
    const [hasFIFALicense, setHasFIFALicense] = useState('all')

    // Data & Loading states
    const [professionals, setProfessionals] = useState<any[]>([])
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

    // Fetch professionals based on filters
    const fetchProfessionals = useCallback(async (newOffset = 0) => {
        if (!currentUserId) return

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                ...(searchTerm && { searchTerm }),
                ...(roleType !== 'all' && { roleType }),
                ...(selectedSport !== 'all' && { sport: selectedSport }),
                ...(selectedPosition !== 'all' && { position: selectedPosition }),
                ...(selectedCity && { city: selectedCity }),
                ...(selectedCountry && { country: selectedCountry }),
                ...(selectedAvailability !== 'all' && { availability: selectedAvailability }),
                ...(selectedLevel !== 'all' && { level: selectedLevel }),
                ...(verified && { verified: 'true' }),
                // Player filters
                ...(minGoals !== null && { minGoals: minGoals.toString() }),
                ...(category !== 'all' && { category }),
                // Coach filters
                ...(uefaLicense !== 'all' && { uefaLicense }),
                ...(specialization && { specialization }),
                // Agent filters
                ...(hasUEFALicense !== 'all' && { hasUEFALicense }),
                ...(hasFIFALicense !== 'all' && { hasFIFALicense }),
                limit: limit.toString(),
                offset: newOffset.toString(),
            })

            const response = await fetch(`/api/search/professionals?${params}`)
            if (!response.ok) throw new Error('Failed to fetch professionals')

            const data = await response.json()
            setProfessionals(data.data || [])
            setTotal(data.total || 0)
            setHasMore(data.hasMore || false)
            setOffset(newOffset)
        } catch (err) {
            console.error('Search error:', err)
            setError('Errore nel caricamento dei professionisti. Riprova.')
            setProfessionals([])
        } finally {
            setLoading(false)
        }
    }, [
        currentUserId,
        searchTerm,
        roleType,
        selectedSport,
        selectedPosition,
        selectedCity,
        selectedCountry,
        selectedAvailability,
        selectedLevel,
        verified,
        minGoals,
        category,
        uefaLicense,
        specialization,
        hasUEFALicense,
        hasFIFALicense,
        limit,
    ])

    // Fetch when filters change
    useEffect(() => {
        if (currentUserId) {
            fetchProfessionals(0)
        }
    }, [
        searchTerm,
        roleType,
        selectedSport,
        selectedPosition,
        selectedCity,
        selectedCountry,
        selectedAvailability,
        selectedLevel,
        verified,
        minGoals,
        category,
        uefaLicense,
        specialization,
        hasUEFALicense,
        hasFIFALicense,
        currentUserId,
        fetchProfessionals,
    ])

    if (!currentUserId) return null

    // Helper function to render the correct card based on role
    const renderCard = (professional: any) => {
        switch (professional.professionalRole) {
            case 'Player':
                return (
                    <PlayerCard
                        key={professional.id}
                        player={professional}
                        currentUserId={currentUserId}
                    />
                )
            case 'Coach':
                return (
                    <CoachCard
                        key={professional.id}
                        coach={professional}
                        currentUserId={currentUserId}
                    />
                )
            case 'Agent':
                return (
                    <AgentCard
                        key={professional.id}
                        agent={professional}
                        currentUserId={currentUserId}
                    />
                )
            default:
                return null
        }
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <SparklesIcon className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Scopri Professionisti
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Ricerca tra giocatori, allenatori e agenti in base a sport, ruolo, location e qualifiche
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Filters */}
                    <div className="lg:col-span-1">
                        <DynamicFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            roleType={roleType}
                            onRoleTypeChange={setRoleType}
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
                            minGoals={minGoals}
                            onMinGoalsChange={setMinGoals}
                            category={category}
                            onCategoryChange={setCategory}
                            uefaLicense={uefaLicense}
                            onUefaLicenseChange={setUefaLicense}
                            specialization={specialization}
                            onSpecializationChange={setSpecialization}
                            hasUEFALicense={hasUEFALicense}
                            onHasUEFALicenseChange={setHasUEFALicense}
                            hasFIFALicense={hasFIFALicense}
                            onHasFIFALicenseChange={setHasFIFALicense}
                        />
                    </div>

                    {/* Main Content - Results */}
                    <div className="lg:col-span-3">
                        {/* Results Info */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {total} professionisti trovati
                            </h2>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                {error}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && professionals.length === 0 && (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin">
                                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full" />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && professionals.length === 0 && !error && (
                            <div className="text-center py-16">
                                <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Nessun professionista trovato
                                </h3>
                                <p className="text-gray-600">
                                    Prova a cambiare i criteri di ricerca
                                </p>
                            </div>
                        )}

                        {/* Professionals Grid */}
                        {professionals.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {professionals.map((professional) => renderCard(professional))}
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => fetchProfessionals(Math.max(0, offset - limit))}
                                        disabled={offset === 0 || loading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                    >
                                        Precedenti
                                    </button>

                                    <span className="text-sm text-gray-600 font-medium">
                                        {offset + 1} - {Math.min(offset + limit, total)} di {total}
                                    </span>

                                    <button
                                        onClick={() => fetchProfessionals(offset + limit)}
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
