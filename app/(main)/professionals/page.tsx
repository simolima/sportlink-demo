"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'
import PlayerCard from '@/components/player-card'
import CoachCard from '@/components/coach-card'
import AgentCard from '@/components/agent-card'
import ProfessionalCard from '@/components/professional-card'
import DynamicFilterBar from '@/components/dynamic-filter-bar'
import { getAuthHeaders } from '@/lib/auth-fetch'

export default function ProfessionalsPage() {
    const router = useRouter()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string>('')

    // Basic Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [roleType, setRoleType] = useState('all')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedPosition, setSelectedPosition] = useState('all')
    const [selectedCity, setSelectedCity] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [selectedAvailability, setSelectedAvailability] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [selectedDetailedCategory, setSelectedDetailedCategory] = useState('all')
    const [verified, setVerified] = useState(false)

    // Player-specific filters
    const [minGoals, setMinGoals] = useState<number | null>(null)
    const [minCleanSheets, setMinCleanSheets] = useState<number | null>(null)
    // Basketball stats
    const [minPoints, setMinPoints] = useState<number | null>(null)
    const [minAssists, setMinAssists] = useState<number | null>(null)
    const [minRebounds, setMinRebounds] = useState<number | null>(null)
    // Volleyball stats
    const [minAces, setMinAces] = useState<number | null>(null)
    const [minBlocks, setMinBlocks] = useState<number | null>(null)
    const [minDigs, setMinDigs] = useState<number | null>(null)
    const [category, setCategory] = useState('all')
    const [selectedSeason, setSelectedSeason] = useState('all')

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
    const [requestingAffiliationPlayerId, setRequestingAffiliationPlayerId] = useState<string | null>(null)
    const [affiliationStatusByPlayer, setAffiliationStatusByPlayer] = useState<Record<string, 'none' | 'pending' | 'active'>>({})

    // Pagination
    const [offset, setOffset] = useState(0)
    const [limit] = useState(12)
    const [hasMore, setHasMore] = useState(false)

    // Auth check & initial load
    useEffect(() => {
        if (typeof window === 'undefined') return

        const userId = localStorage.getItem('currentUserId')
        const roleId = (localStorage.getItem('currentUserRole') || '').toLowerCase()
        if (!userId) {
            router.push('/login')
            return
        }
        setCurrentUserId(userId)
        setCurrentUserRole(roleId)
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
                ...(selectedLevel !== 'all' && { category: selectedLevel }),
                ...(selectedDetailedCategory !== 'all' && { detailedCategory: selectedDetailedCategory }),
                ...(verified && { verified: 'true' }),
                // Player filters
                ...(minGoals !== null && { minGoals: minGoals.toString() }),
                ...(minCleanSheets !== null && { minCleanSheets: minCleanSheets.toString() }),
                ...(minPoints !== null && { minPoints: minPoints.toString() }),
                ...(minAssists !== null && { minAssists: minAssists.toString() }),
                ...(minRebounds !== null && { minRebounds: minRebounds.toString() }),
                ...(minAces !== null && { minAces: minAces.toString() }),
                ...(minBlocks !== null && { minBlocks: minBlocks.toString() }),
                ...(minDigs !== null && { minDigs: minDigs.toString() }),
                ...(category !== 'all' && { category }),
                ...(selectedSeason !== 'all' && { season: selectedSeason }),
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
        selectedDetailedCategory,
        verified,
        minGoals,
        minCleanSheets,
        minPoints,
        minAssists,
        minRebounds,
        minAces,
        minBlocks,
        minDigs,
        category,
        selectedSeason,
        uefaLicense,
        specialization,
        hasUEFALicense,
        hasFIFALicense,
        limit,
    ])

    const fetchAgentAffiliationStatuses = useCallback(async () => {
        if (!currentUserId || currentUserRole !== 'agent') {
            setAffiliationStatusByPlayer({})
            return
        }

        try {
            const res = await fetch(`/api/affiliations?agentId=${currentUserId}`)
            if (!res.ok) return

            const data = await res.json()
            const statusMap: Record<string, 'none' | 'pending' | 'active'> = {}

            for (const affiliation of Array.isArray(data) ? data : []) {
                if (affiliation?.status === 'pending' || affiliation?.status === 'active') {
                    statusMap[String(affiliation.playerId)] = affiliation.status
                }
            }

            setAffiliationStatusByPlayer(statusMap)
        } catch (fetchError) {
            console.error('Error fetching affiliation statuses:', fetchError)
        }
    }, [currentUserId, currentUserRole])

    const handleRequestAffiliation = useCallback(async (playerId: string) => {
        if (!currentUserId || currentUserRole !== 'agent' || requestingAffiliationPlayerId) return

        setRequestingAffiliationPlayerId(playerId)

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/affiliations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    agentId: currentUserId,
                    playerId,
                    notes: 'Richiesta di affiliazione da Scopri Professionisti',
                }),
            })

            if (res.ok) {
                setAffiliationStatusByPlayer((prev) => ({
                    ...prev,
                    [String(playerId)]: 'pending',
                }))
                return
            }

            const payload = await res.json().catch(() => ({}))
            if (res.status === 401) {
                setError('Sessione scaduta: effettua nuovamente il login per inviare richieste di affiliazione.')
            } else if (res.status === 403 && payload?.error === 'forbidden_agent_mismatch') {
                setError('Mismatch account/sessione: rientra con il profilo agente corretto.')
            } else {
                setError(payload?.error || 'Errore durante l\'invio della richiesta di affiliazione.')
            }
        } catch (requestError) {
            console.error('Error requesting affiliation:', requestError)
            setError('Errore durante l\'invio della richiesta di affiliazione.')
        } finally {
            setRequestingAffiliationPlayerId(null)
        }
    }, [currentUserId, currentUserRole, requestingAffiliationPlayerId])

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
        selectedDetailedCategory,
        verified,
        minGoals,
        minCleanSheets,
        minPoints,
        minAssists,
        minRebounds,
        minAces,
        minBlocks,
        minDigs,
        category,
        selectedSeason,
        uefaLicense,
        specialization,
        hasUEFALicense,
        hasFIFALicense,
        currentUserId,
        fetchProfessionals,
    ])

    useEffect(() => {
        fetchAgentAffiliationStatuses()
    }, [fetchAgentAffiliationStatuses])

    const hasActiveFilters = Boolean(
        searchTerm ||
        roleType !== 'all' ||
        selectedSport !== 'all' ||
        selectedPosition !== 'all' ||
        selectedCity ||
        selectedCountry ||
        selectedAvailability !== 'all' ||
        selectedLevel !== 'all' ||
        selectedDetailedCategory !== 'all' ||
        verified ||
        minGoals !== null ||
        minCleanSheets !== null ||
        minPoints !== null ||
        minAssists !== null ||
        minRebounds !== null ||
        minAces !== null ||
        minBlocks !== null ||
        minDigs !== null ||
        category !== 'all' ||
        selectedSeason !== 'all' ||
        uefaLicense !== 'all' ||
        specialization ||
        hasUEFALicense !== 'all' ||
        hasFIFALicense !== 'all'
    )

    const resetFilters = () => {
        setSearchTerm('')
        setRoleType('all')
        setSelectedSport('all')
        setSelectedPosition('all')
        setSelectedCity('')
        setSelectedCountry('')
        setSelectedAvailability('all')
        setSelectedLevel('all')
        setSelectedDetailedCategory('all')
        setVerified(false)
        setMinGoals(null)
        setMinCleanSheets(null)
        setMinPoints(null)
        setMinAssists(null)
        setMinRebounds(null)
        setMinAces(null)
        setMinBlocks(null)
        setMinDigs(null)
        setCategory('all')
        setSelectedSeason('all')
        setUefaLicense('all')
        setSpecialization('')
        setHasUEFALicense('all')
        setHasFIFALicense('all')
        setError(null)
    }

    const activeFilterChips: Array<{ key: string; label: string; onRemove: () => void }> = [
        ...(searchTerm ? [{ key: 'searchTerm', label: `Ricerca: ${searchTerm}`, onRemove: () => setSearchTerm('') }] : []),
        ...(roleType !== 'all' ? [{ key: 'roleType', label: `Ruolo: ${roleType}`, onRemove: () => setRoleType('all') }] : []),
        ...(selectedSport !== 'all' ? [{ key: 'sport', label: `Sport: ${selectedSport}`, onRemove: () => setSelectedSport('all') }] : []),
        ...(selectedPosition !== 'all' ? [{ key: 'position', label: `Posizione: ${selectedPosition}`, onRemove: () => setSelectedPosition('all') }] : []),
        ...(selectedCity ? [{ key: 'city', label: `Città: ${selectedCity}`, onRemove: () => setSelectedCity('') }] : []),
        ...(selectedCountry ? [{ key: 'country', label: `Paese: ${selectedCountry}`, onRemove: () => setSelectedCountry('') }] : []),
        ...(selectedAvailability !== 'all' ? [{ key: 'availability', label: `Disponibilità: ${selectedAvailability}`, onRemove: () => setSelectedAvailability('all') }] : []),
        ...(selectedLevel !== 'all' ? [{ key: 'level', label: `Livello: ${selectedLevel}`, onRemove: () => setSelectedLevel('all') }] : []),
        ...(selectedDetailedCategory !== 'all' ? [{ key: 'detailedCategory', label: `Categoria: ${selectedDetailedCategory}`, onRemove: () => setSelectedDetailedCategory('all') }] : []),
        ...(verified ? [{ key: 'verified', label: 'Solo verificati', onRemove: () => setVerified(false) }] : []),
        ...(minGoals !== null ? [{ key: 'minGoals', label: `Goal min: ${minGoals}`, onRemove: () => setMinGoals(null) }] : []),
        ...(minCleanSheets !== null ? [{ key: 'minCleanSheets', label: `Clean sheet min: ${minCleanSheets}`, onRemove: () => setMinCleanSheets(null) }] : []),
        ...(minPoints !== null ? [{ key: 'minPoints', label: `Punti min: ${minPoints}`, onRemove: () => setMinPoints(null) }] : []),
        ...(minAssists !== null ? [{ key: 'minAssists', label: `Assist min: ${minAssists}`, onRemove: () => setMinAssists(null) }] : []),
        ...(minRebounds !== null ? [{ key: 'minRebounds', label: `Rimbalzi min: ${minRebounds}`, onRemove: () => setMinRebounds(null) }] : []),
        ...(minAces !== null ? [{ key: 'minAces', label: `Aces min: ${minAces}`, onRemove: () => setMinAces(null) }] : []),
        ...(minBlocks !== null ? [{ key: 'minBlocks', label: `Blocchi min: ${minBlocks}`, onRemove: () => setMinBlocks(null) }] : []),
        ...(minDigs !== null ? [{ key: 'minDigs', label: `Difese min: ${minDigs}`, onRemove: () => setMinDigs(null) }] : []),
        ...(category !== 'all' ? [{ key: 'category', label: `Categoria stagione: ${category}`, onRemove: () => setCategory('all') }] : []),
        ...(selectedSeason !== 'all' ? [{ key: 'season', label: `Stagione: ${selectedSeason}`, onRemove: () => setSelectedSeason('all') }] : []),
        ...(uefaLicense !== 'all' ? [{ key: 'uefaLicense', label: `Licenza UEFA: ${uefaLicense}`, onRemove: () => setUefaLicense('all') }] : []),
        ...(specialization ? [{ key: 'specialization', label: `Specializzazione: ${specialization}`, onRemove: () => setSpecialization('') }] : []),
        ...(hasUEFALicense !== 'all' ? [{ key: 'hasUEFALicense', label: `UEFA agente: ${hasUEFALicense}`, onRemove: () => setHasUEFALicense('all') }] : []),
        ...(hasFIFALicense !== 'all' ? [{ key: 'hasFIFALicense', label: `FIFA agente: ${hasFIFALicense}`, onRemove: () => setHasFIFALicense('all') }] : []),
    ]

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
                        canRequestAffiliation={currentUserRole === 'agent'}
                        affiliationStatus={affiliationStatusByPlayer[String(professional.id)] || 'none'}
                        onRequestAffiliation={handleRequestAffiliation}
                        requestingAffiliation={requestingAffiliationPlayerId === String(professional.id)}
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
            // Use generic ProfessionalCard for other roles
            case 'Sporting Director':
            case 'Athletic Trainer':
            case 'Nutritionist':
            case 'Physio/Masseur':
            case 'Talent Scout':
                return (
                    <ProfessionalCard
                        key={professional.id}
                        professional={professional}
                        currentUserId={currentUserId}
                    />
                )
            default:
                return null
        }
    }

    return (
        <main className="min-h-screen glass-page-bg">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="glass-panel rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <SparklesIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-extrabold text-white">
                            Scopri Professionisti
                        </h1>
                    </div>
                    <p className="glass-subtle-text">
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
                            selectedDetailedCategory={selectedDetailedCategory}
                            onDetailedCategoryChange={setSelectedDetailedCategory}
                            verified={verified}
                            onVerifiedChange={setVerified}
                            minGoals={minGoals}
                            onMinGoalsChange={setMinGoals}
                            minCleanSheets={minCleanSheets}
                            onMinCleanSheetsChange={setMinCleanSheets}
                            minPoints={minPoints}
                            onMinPointsChange={setMinPoints}
                            minAssists={minAssists}
                            onMinAssistsChange={setMinAssists}
                            minRebounds={minRebounds}
                            onMinReboundsChange={setMinRebounds}
                            minAces={minAces}
                            onMinAcesChange={setMinAces}
                            minBlocks={minBlocks}
                            onMinBlocksChange={setMinBlocks}
                            minDigs={minDigs}
                            onMinDigsChange={setMinDigs}
                            category={category}
                            onCategoryChange={setCategory}
                            selectedSeason={selectedSeason}
                            onSeasonChange={setSelectedSeason}
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
                        <div className="mb-6 flex items-center justify-between glass-widget rounded-2xl px-4 py-3">
                            <h2 className="text-lg font-semibold text-white">
                                {total} professionisti trovati
                            </h2>
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="px-3 py-1.5 text-sm font-semibold text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    Reset filtri
                                </button>
                            )}
                        </div>

                        {(activeFilterChips.length > 0 || currentUserRole === 'agent') && (
                            <div className="mb-5 space-y-3">
                                {activeFilterChips.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {activeFilterChips.map((chip) => (
                                            <button
                                                key={chip.key}
                                                onClick={chip.onRemove}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors"
                                            >
                                                <span>{chip.label}</span>
                                                <span aria-hidden="true">×</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentUserRole === 'agent' && (
                                    <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <p className="text-sm text-primary font-medium">
                                            Modalità Agente attiva: puoi inviare richieste ai Player direttamente dalle card.
                                        </p>
                                        <button
                                            onClick={() => router.push('/agent/affiliations')}
                                            className="px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-brand-700 rounded-lg transition-colors"
                                        >
                                            Le mie affiliazioni
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
                                {error}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && professionals.length === 0 && (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin">
                                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full" />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && professionals.length === 0 && !error && (
                            <div className="text-center py-16 glass-widget rounded-2xl">
                                <SparklesIcon className="w-16 h-16 text-secondary/55 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Nessun professionista trovato
                                </h3>
                                <p className="glass-subtle-text">
                                    Prova a cambiare i criteri di ricerca
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="mt-4 px-4 py-2 bg-primary hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors duration-200"
                                    >
                                        Rimuovi tutti i filtri
                                    </button>
                                )}
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
                                        className="px-4 py-2 bg-[#0A0F32] hover:bg-[#161B4A] disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                    >
                                        Precedenti
                                    </button>

                                    <span className="text-sm text-gray-600 font-medium">
                                        {offset + 1} - {Math.min(offset + limit, total)} di {total}
                                    </span>

                                    <button
                                        onClick={() => fetchProfessionals(offset + limit)}
                                        disabled={!hasMore || loading}
                                        className="px-4 py-2 bg-[#0A0F32] hover:bg-[#161B4A] disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
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
