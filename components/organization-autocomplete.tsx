"use client"

import { useState, useEffect, useRef } from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface Organization {
    id: string
    name: string
    country: string
    city: string | null
    sport: string
}

interface OrganizationAutocompleteProps {
    value: string
    onChange: (value: string, org?: Organization) => void
    sport?: string
    country?: string
    placeholder?: string
    className?: string
    disabled?: boolean
}

export default function OrganizationAutocomplete({
    value,
    onChange,
    sport,
    country,
    placeholder = "Cerca organizzazione...",
    className = "",
    disabled = false
}: OrganizationAutocompleteProps) {
    const [query, setQuery] = useState(value)
    const [results, setResults] = useState<Organization[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

    // Chiudi dropdown quando clicchi fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Sync con valore esterno
    useEffect(() => {
        if (value !== query) {
            setQuery(value)
        }
    }, [value])

    // Debounced search
    const searchOrganizations = async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                q: searchQuery,
            })
            if (sport) params.append('sport', sport)
            if (country) params.append('country', country)

            const res = await fetch(`/api/sports-organizations?${params}`)
            if (res.ok) {
                const data = await res.json()
                setResults(data)
                setIsOpen(data.length > 0)
            }
        } catch (err) {
            console.error('Error searching organizations:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value
        setQuery(newQuery)
        setSelectedOrg(null)
        onChange(newQuery)

        // Debounce search
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }
        debounceTimer.current = setTimeout(() => {
            searchOrganizations(newQuery)
        }, 300)
    }

    const handleSelect = (org: Organization) => {
        setQuery(org.name)
        setSelectedOrg(org)
        setIsOpen(false)
        onChange(org.name, org)
    }

    const handleClear = () => {
        setQuery('')
        setSelectedOrg(null)
        setResults([])
        setIsOpen(false)
        onChange('')
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true)
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                    autoComplete="off"
                />

                {/* Icons */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isLoading && (
                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {!isLoading && query && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="pointer-events-auto hover:text-gray-600"
                        >
                            <XMarkIcon className="h-4 w-4 text-gray-400" />
                        </button>
                    )}
                    {!isLoading && !query && (
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {results.map((org) => (
                        <button
                            key={org.id}
                            type="button"
                            onClick={() => handleSelect(org)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                            <div className="font-medium text-gray-900">{org.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {org.city && `${org.city}, `}{org.country} • {org.sport}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
                    Nessuna organizzazione trovata per "{query}"
                    <div className="text-xs text-gray-400 mt-1">
                        Contatta l'amministratore per aggiungere questa organizzazione
                    </div>
                </div>
            )}
        </div>
    )
}
