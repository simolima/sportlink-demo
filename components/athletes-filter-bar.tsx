"use client"
import React from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { SUPPORTED_SPORTS } from '@/lib/types'

interface FilterBarProps {
    searchTerm: string
    onSearchChange: (value: string) => void
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
}

// Position mapping per sport
const positionsBySport: Record<string, string[]> = {
    'Calcio': ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'],
    'Basket': ['Playmaker', 'Guardia', 'Ala piccola', 'Ala grande', 'Centro'],
    'Pallavolo': ['Palleggiatore', 'Schiacciatore', 'Centrale', 'Opposto', 'Libero'],
}

const AVAILABILITY_OPTIONS = ['Disponibile', 'Non disponibile']
const LEVEL_OPTIONS = ['Amateur', 'Semi-Professional', 'Professional', 'Youth']

export default function FilterBar({
    searchTerm,
    onSearchChange,
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
}: FilterBarProps) {
    const positions = selectedSport && selectedSport !== 'all'
        ? (positionsBySport[selectedSport] || [])
        : []

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
                    Cerca Atleta
                </label>
                <input
                    type="text"
                    placeholder="Nome, email, ruolo..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                />
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
                        onPositionChange('all') // Reset position when sport changes
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

            {/* Position Filter (contextual) */}
            {positions.length > 0 && (
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
                onClick={() => {
                    onSearchChange('')
                    onSportChange('all')
                    onPositionChange('all')
                    onCityChange('')
                    onCountryChange('')
                    onAvailabilityChange('all')
                    onLevelChange('all')
                    onVerifiedChange(false)
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors duration-200"
            >
                Azzera Filtri
            </button>
        </aside>
    )
}
