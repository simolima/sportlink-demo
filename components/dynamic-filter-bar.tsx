"use client"
import React from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { SUPPORTED_SPORTS } from '@/lib/types'

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
    verified: boolean
    onVerifiedChange: (value: boolean) => void
    // Player-specific
    minGoals: number | null
    onMinGoalsChange: (value: number | null) => void
    category: string
    onCategoryChange: (value: string) => void
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

const AVAILABILITY_OPTIONS = ['Disponibile', 'Non disponibile']
const LEVEL_OPTIONS = ['Amateur', 'Semi-Professional', 'Professional', 'Youth']
const CATEGORY_OPTIONS = ['Youth', 'Amateur', 'Semi-Professional', 'Professional']
const UEFA_LICENSES = ['UEFA Pro License', 'UEFA A License', 'UEFA B License', 'UEFA C License', 'none']
const ROLE_TYPES = ['all', 'Player', 'Coach', 'Agent']

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
    verified,
    onVerifiedChange,
    minGoals,
    onMinGoalsChange,
    category,
    onCategoryChange,
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
        onVerifiedChange(false)
        onMinGoalsChange(null)
        onCategoryChange('all')
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
                    {ROLE_TYPES.filter(r => r !== 'all').map((role) => (
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

            {/* Level Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Livello
                </label>
                <select
                    value={selectedLevel}
                    onChange={(e) => onLevelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                >
                    <option value="all">Tutti i Livelli</option>
                    {LEVEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            </div>

            {/* ===== PLAYER-SPECIFIC FILTERS ===== */}
            {(roleType === 'Player' || roleType === 'all') && (
                <>
                    {/* Min Goals Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Goal Minima (Ultima Stagione)
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

                    {/* Category Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Categoria
                        </label>
                        <select
                            value={category}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        >
                            <option value="all">Tutte le Categorie</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
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
