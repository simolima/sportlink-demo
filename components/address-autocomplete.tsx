'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AddressResult {
    address: string
    city: string
    lat: number
    lng: number
}

interface Suggestion {
    placeId: string
    mainText: string
    secondaryText: string
    fullText: string
}

interface Props {
    value: string
    onChange: (result: AddressResult) => void
    placeholder?: string
    className?: string
    required?: boolean
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'es. Via dello Sport, 1, Milano', className, required }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = useState(value)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Chiudi dropdown cliccando fuori
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchSuggestions = useCallback(async (input: string) => {
        if (input.trim().length < 3) {
            setSuggestions([])
            setShowDropdown(false)
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/places-autocomplete?type=autocomplete&input=${encodeURIComponent(input)}`)
            const data = await res.json()
            const results = data.suggestions || []
            setSuggestions(results)
            setShowDropdown(results.length > 0)
        } catch {
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        setInputValue(v)
        clearTimeout(debounceRef.current)
        if (v.trim().length >= 3) {
            debounceRef.current = setTimeout(() => fetchSuggestions(v), 300)
        } else {
            setSuggestions([])
            setShowDropdown(false)
        }
    }

    const handleSelect = async (suggestion: Suggestion) => {
        setShowDropdown(false)
        setSuggestions([])
        setInputValue(suggestion.fullText || suggestion.mainText)

        try {
            const res = await fetch(`/api/places-autocomplete?type=details&placeId=${encodeURIComponent(suggestion.placeId)}`)
            const data = await res.json()
            if (data.address) {
                setInputValue(data.address)
                onChange({ address: data.address, city: data.city || '', lat: data.lat || 0, lng: data.lng || 0 })
            }
        } catch {
            // Fallback: usa il testo visualizzato
            onChange({ address: suggestion.fullText || suggestion.mainText, city: '', lat: 0, lng: 0 })
        }
    }

    const handleClear = () => {
        setInputValue('')
        setSuggestions([])
        setShowDropdown(false)
        onChange({ address: '', city: '', lat: 0, lng: 0 })
        inputRef.current?.focus()
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    required={required}
                    value={inputValue}
                    onChange={handleInput}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={`pl-9 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${className ?? ''}`}
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown suggerimenti */}
            {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i) => (
                        <li
                            key={s.placeId || i}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
                            className="flex items-start gap-2 px-4 py-2.5 cursor-pointer hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-800">
                                <span className="font-medium">{s.mainText}</span>
                                {s.secondaryText && <span className="text-gray-500">, {s.secondaryText}</span>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {loading && (
                <p className="mt-1 text-xs text-gray-400">Ricerca in corso...</p>
            )}
            {!loading && !showDropdown && (
                <p className="mt-1 text-xs text-gray-400">
                    Digita almeno 3 caratteri per i suggerimenti
                </p>
            )}
        </div>
    )
}
