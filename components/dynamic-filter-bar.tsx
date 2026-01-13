"use client"
import React from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { SUPPORTED_SPORTS, PROFESSIONAL_ROLES } from '@/lib/types'

interface DynamicFilterBarProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    roleType: string
    onRoleTypeChange: (value: string) => void
    selectedSport: string
    onSportChange: (value: string) => void
    selectedPosition: string
    onPositionChange: (value: string) => void
    selectedCity: string
    onCityChange: (value: string) => void
    selectedCountry: string
    onCountryChange: (value: string) => void
    selectedAvailability: string
    onAvailabilityChange: (value: string) => void
    selectedLevel: string
    onLevelChange: (value: string) => void
    selectedDetailedCategory: string
    onDetailedCategoryChange: (value: string) => void
    verified: boolean
    onVerifiedChange: (value: boolean) => void
    // Player-specific
    minGoals: number | null
    onMinGoalsChange: (value: number | null) => void
    minCleanSheets: number | null
    onMinCleanSheetsChange: (value: number | null) => void
    // Basketball stats
    minPoints: number | null
    onMinPointsChange: (value: number | null) => void
    minAssists: number | null
    onMinAssistsChange: (value: number | null) => void
    minRebounds: number | null
    onMinReboundsChange: (value: number | null) => void
    // Volleyball stats
    minAces: number | null
    onMinAcesChange: (value: number | null) => void
    minBlocks: number | null
    onMinBlocksChange: (value: number | null) => void
    minDigs: number | null
    onMinDigsChange: (value: number | null) => void
    category: string
    onCategoryChange: (value: string) => void
    selectedSeason: string
    onSeasonChange: (value: string) => void
    // Coach-specific
    uefaLicense: string
    onUefaLicenseChange: (value: string) => void
    specialization: string
    onSpecializationChange: (value: string) => void
    // Agent-specific
    hasUEFALicense: string
    onHasUEFALicenseChange: (value: string) => void
    hasFIFALicense: string
    onHasFIFALicenseChange: (value: string) => void
}

const positionsBySport: Record<string, string[]> = {
    'Calcio': ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'],
    'Basket': ['Playmaker', 'Guardia', 'Ala piccola', 'Ala grande', 'Centro'],
    'Pallavolo': ['Palleggiatore', 'Schiacciatore', 'Centrale', 'Opposto', 'Libero'],
}

const CATEGORY_OPTIONS_BY_SPORT: Record<string, string[]> = {
    'Calcio': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
    'Basket': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
    'Pallavolo': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
}

// Categorie dettagliate per sport e tier
const DETAILED_CATEGORIES: Record<string, Record<string, string[]>> = {
    'Calcio': {
        'Professionisti': ['Serie A', 'Serie B', 'Lega Pro', 'Altro'],
        'Dilettanti': ['Serie D', 'Eccellenza', 'Promozione', 'Prima Categoria', 'Seconda Categoria', 'Terza Categoria', 'Altro'],
        'Amatori': ['CSI', 'Altro'],
        'Settore giovanile professionistico': ['Primavera 1', 'Primavera 2', 'Primavera 3', 'Primavera 4', 'Altro'],
        'Settore giovanile dilettantistico': ['Under 19 Gold', 'Under 17 Gold', 'Under 15 Gold', 'Under 14', 'Under 13', 'Altro'],
    },
    'Basket': {
        'Professionisti': ['Serie A (LBA)', 'Serie A2', 'Serie B', 'Altro'],
        'Dilettanti': ['Serie B interregionale', 'Serie C gold', 'Serie C silver', 'Serie D', 'Prima Divisione', 'Seconda Divisione', 'Altro'],
        'Amatori': ['Promozionali / Amatori', 'Altro'],
        'Settore giovanile professionistico': ['Under 19 Eccellenza', 'Under 17 Eccellenza', 'Under 15 Eccellenza', 'Altro'],
        'Settore giovanile dilettantistico': ['Under 19 Gold', 'Under 17 Gold', 'Under 15 Gold', 'Under 14', 'Under 13', 'Altro'],
    },
    'Pallavolo': {
        'Professionisti': ['SuperLega Serie A', 'Serie A2', 'Altro'],
        'Dilettanti': ['Serie A3', 'Serie B', 'Serie C', 'Serie D', 'Prima divisione', 'Seconda divisione', 'Terza divisione', 'Altro'],
        'Amatori': ['Amatoriali', 'Altro'],
        'Settore giovanile professionistico': ['Under 19', 'Under 17', 'Under 15', 'Altro'],
        'Settore giovanile dilettantistico': ['Under 14', 'Under 13', 'Under 12', 'Altro'],
    },
}

const AVAILABILITY_OPTIONS = ['Disponibile', 'Non disponibile']
const UEFA_LICENSES = ['UEFA Pro License', 'UEFA A License', 'UEFA B License', 'UEFA C License', 'none']

export default function DynamicFilterBar({
    searchTerm,
    onSearchChange,
    roleType,
    onRoleTypeChange,
    selectedSport,
    onSportChange,
    selectedPosition,
    onPositionChange,
    selectedCity,
    onCityChange,
    selectedCountry,
    onCountryChange,
    selectedAvailability,
    onAvailabilityChange,
    selectedLevel,
    onLevelChange,
    selectedDetailedCategory,
    onDetailedCategoryChange,
    verified,
    onVerifiedChange,
    minGoals,
    onMinGoalsChange,
    minCleanSheets,
    onMinCleanSheetsChange,
    minPoints,
    onMinPointsChange,
    minAssists,
    onMinAssistsChange,
    minRebounds,
    onMinReboundsChange,
    minAces,
    onMinAcesChange,
    minBlocks,
    onMinBlocksChange,
    minDigs,
    onMinDigsChange,
    category,
    onCategoryChange,
    selectedSeason,
    onSeasonChange,
    uefaLicense,
    onUefaLicenseChange,
    specialization,
    onSpecializationChange,
    hasUEFALicense,
    onHasUEFALicenseChange,
    hasFIFALicense,
    onHasFIFALicenseChange,
}: DynamicFilterBarProps) {
    const positions = selectedSport && selectedSport !== 'all'
        ? (positionsBySport[selectedSport] || [])
        : []

    const resetFilters = () => {
        onSearchChange('')
        onSportChange('all')
        onPositionChange('all')
        onCityChange('')
        onCountryChange('')
        onAvailabilityChange('all')
        onLevelChange('all')
        onDetailedCategoryChange('all')
        onVerifiedChange(false)
        onMinGoalsChange(null)
        onMinCleanSheetsChange(null)
        onMinPointsChange(null)
        onMinAssistsChange(null)
        onMinReboundsChange(null)
        onMinAcesChange(null)
        onMinBlocksChange(null)
        onMinDigsChange(null)
        onCategoryChange('all')
        onSeasonChange('all')
        onUefaLicenseChange('all')
        onSpecializationChange('')
        onHasUEFALicenseChange('all')
        onHasFIFALicenseChange('all')
    }

    return (
        <aside className="bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <FunnelIcon className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-lg text-gray-900">Filtra Ricerca</h2>
            </div>

            {/* Search Input */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cerca Professionista
                </label>
                <input
                    type="text"
                    placeholder="Nome, email, ruolo..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                />
            </div>

            {/* Role Type Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo di Professionista
                </label>
                <select
                    value={roleType}
                    onChange={(e) => {
                        onRoleTypeChange(e.target.value)
                        // Reset role-specific filters
                        onMinGoalsChange(null)
                        onCategoryChange('all')
                        onUefaLicenseChange('all')
                        onSpecializationChange('')
                        onHasUEFALicenseChange('all')
                        onHasFIFALicenseChange('all')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                >
                    <option value="all">Tutti i Professionisti</option>
                    {PROFESSIONAL_ROLES.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sport Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sport
                </label>
                <select
                    value={selectedSport}
                    onChange={(e) => {
                        onSportChange(e.target.value)
                        onPositionChange('all')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                >
                    <option value="all">Tutti gli Sport</option>
                    {SUPPORTED_SPORTS.map((sport) => (
                        <option key={sport} value={sport}>
                            {sport}
                        </option>
                    ))}
                </select>
            </div>

            {/* Position Filter (Contextual - Players only) */}
            {(roleType === 'Player' || roleType === 'all') && positions.length > 0 && (
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ruolo
                    </label>
                    <select
                        value={selectedPosition}
                        onChange={(e) => onPositionChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                    >
                        <option value="all">Tutti i Ruoli</option>
                        {positions.map((pos) => (
                            <option key={pos} value={pos}>
                                {pos}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* City Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Città
                </label>
                <input
                    type="text"
                    placeholder="Es. Milano"
                    value={selectedCity}
                    onChange={(e) => onCityChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                />
            </div>

            {/* Country Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paese
                </label>
                <input
                    type="text"
                    placeholder="Es. Italia"
                    value={selectedCountry}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                />
            </div>

            {/* Availability Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Disponibilità
                </label>
                <select
                    value={selectedAvailability}
                    onChange={(e) => onAvailabilityChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                >
                    <option value="all">Tutte</option>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            </div>

            {/* Category Filter - Sport Specific (Macro-categoria) */}
            {selectedSport !== 'all' && (selectedSport === 'Calcio' || selectedSport === 'Basket' || selectedSport === 'Pallavolo') && (
                <>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Categoria
                        </label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => {
                                onLevelChange(e.target.value)
                                onDetailedCategoryChange('all')
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        >
                            <option value="all">Tutte le Categorie</option>
                            {(CATEGORY_OPTIONS_BY_SPORT[selectedSport] || []).map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Detailed Category Filter (Serie A, Serie B, ecc.) */}
                    {selectedLevel !== 'all' && DETAILED_CATEGORIES[selectedSport]?.[selectedLevel] && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {selectedSport === 'Calcio' ? 'Serie/Divisione' : 'Livello Dettagliato'}
                            </label>
                            <select
                                value={selectedDetailedCategory}
                                onChange={(e) => onDetailedCategoryChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                            >
                                <option value="all">Tutte le opzioni</option>
                                {(DETAILED_CATEGORIES[selectedSport]?.[selectedLevel] || []).map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            {/* ===== PLAYER-SPECIFIC FILTERS ===== */}
            {(roleType === 'Player' || roleType === 'all') && (
                <>
                    {/* Season Filter - PRIMO FILTRO */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Stagione
                        </label>
                        <select
                            value={selectedSeason}
                            onChange={(e) => onSeasonChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        >
                            <option value="all">Tutte le stagioni</option>
                            <option value="2025/2026">2025/2026</option>
                            <option value="2024/2025">2024/2025</option>
                            <option value="2023/2024">2023/2024</option>
                            <option value="2022/2023">2022/2023</option>
                            <option value="2021/2022">2021/2022</option>
                        </select>
                    </div>

                    {/* CALCIO - Goal & Porte Inviolate */}
                    {selectedSport === 'Calcio' && (
                        <>
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Goal Minima (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 5"
                                    value={minGoals ?? ''}
                                    onChange={(e) => onMinGoalsChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Porte Inviolate Minime (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 3"
                                    value={minCleanSheets ?? ''}
                                    onChange={(e) => onMinCleanSheetsChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* BASKET - Punti, Assist, Rimbalzi */}
                    {selectedSport === 'Basket' && (
                        <>
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Punti/Partita Minimi (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="Es. 10.5"
                                    value={minPoints ?? ''}
                                    onChange={(e) => onMinPointsChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Assist Minimi (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 5"
                                    value={minAssists ?? ''}
                                    onChange={(e) => onMinAssistsChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Rimbalzi Minimi (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 8"
                                    value={minRebounds ?? ''}
                                    onChange={(e) => onMinReboundsChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* PALLAVOLO - Ace, Muri, Difese */}
                    {selectedSport === 'Pallavolo' && (
                        <>
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ace Minimi (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 15"
                                    value={minAces ?? ''}
                                    onChange={(e) => onMinAcesChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Muri Minimi (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 10"
                                    value={minBlocks ?? ''}
                                    onChange={(e) => onMinBlocksChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Difese Minime (Stagione Selezionata)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Es. 20"
                                    value={minDigs ?? ''}
                                    onChange={(e) => onMinDigsChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ===== COACH-SPECIFIC FILTERS ===== */}
            {(roleType === 'Coach' || roleType === 'all') && (
                <>
                    {/* UEFA License Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Licenza UEFA
                        </label>
                        <select
                            value={uefaLicense}
                            onChange={(e) => onUefaLicenseChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        >
                            <option value="all">Tutte le Licenze</option>
                            {UEFA_LICENSES.map((license) => (
                                <option key={license} value={license}>
                                    {license === 'none' ? 'Nessuna licenza' : license}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Specialization Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Specializzazione
                        </label>
                        <input
                            type="text"
                            placeholder="Es. Difesa, Attacco..."
                            value={specialization}
                            onChange={(e) => onSpecializationChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        />
                    </div>
                </>
            )}

            {/* ===== AGENT-SPECIFIC FILTERS ===== */}
            {(roleType === 'Agent' || roleType === 'all') && (
                <>
                    {/* UEFA License Filter */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasUEFALicense === 'true'}
                                onChange={(e) => onHasUEFALicenseChange(e.target.checked ? 'true' : 'all')}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Possiede Licenza UEFA</span>
                        </label>
                    </div>

                    {/* FIFA License Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasFIFALicense === 'true'}
                                onChange={(e) => onHasFIFALicenseChange(e.target.checked ? 'true' : 'all')}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Possiede Licenza FIFA</span>
                        </label>
                    </div>
                </>
            )}

            {/* Verified Filter */}
            <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={verified}
                        onChange={(e) => onVerifiedChange(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Solo Profili Verificati</span>
                </label>
            </div>

            {/* Reset Button */}
            <button
                onClick={resetFilters}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors duration-200"
            >
                Azzera Filtri
            </button>
        </aside>
    )
}
