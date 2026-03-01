'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AddressResult {
    address: string
    city: string
    lat: number
    lng: number
}

interface Props {
    value: string
    onChange: (result: AddressResult) => void
    placeholder?: string
    className?: string
    required?: boolean
}

// Carica lo script Google Maps Places in modo lazy (una sola volta)
let googleMapsScriptLoaded = false
let googleMapsLoadPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string): Promise<void> {
    if (googleMapsScriptLoaded) return Promise.resolve()
    if (googleMapsLoadPromise) return googleMapsLoadPromise

    googleMapsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=it`
        script.async = true
        script.defer = true
        script.onload = () => {
            googleMapsScriptLoaded = true
            resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
    })

    return googleMapsLoadPromise
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'es. Via dello Sport, 1, Milano', className, required }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const [inputValue, setInputValue] = useState(value)
    const [isLoaded, setIsLoaded] = useState(false)
    const [loadError, setLoadError] = useState(false)

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const initAutocomplete = useCallback(() => {
        if (!inputRef.current || !window.google?.maps?.places) return

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: ['it', 'ch', 'sm', 'va'] }, // Italia + paesi confinanti
            fields: ['formatted_address', 'geometry', 'address_components'],
        })

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            if (!place?.geometry?.location) return

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const address = place.formatted_address || ''

            // Estrai la città dai componenti dell'indirizzo
            let city = ''
            for (const component of place.address_components || []) {
                if (component.types.includes('locality')) {
                    city = component.long_name
                    break
                }
                if (component.types.includes('administrative_area_level_3')) {
                    city = component.long_name
                }
            }

            setInputValue(address)
            onChange({ address, city, lat, lng })
        })

        setIsLoaded(true)
    }, [onChange])

    useEffect(() => {
        if (!apiKey) {
            setLoadError(true)
            return
        }

        loadGoogleMapsScript(apiKey)
            .then(() => initAutocomplete())
            .catch(() => setLoadError(true))
    }, [apiKey, initAutocomplete])

    const handleClear = () => {
        setInputValue('')
        onChange({ address: '', city: '', lat: 0, lng: 0 })
        inputRef.current?.focus()
    }

    return (
        <div className="relative">
            <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    required={required}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
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
            {loadError && (
                <p className="mt-1 text-xs text-amber-600">
                    Google Maps non disponibile — inserisci l&apos;indirizzo manualmente.
                </p>
            )}
            {!loadError && isLoaded && (
                <p className="mt-1 text-xs text-gray-400">
                    Inizia a digitare per vedere i suggerimenti di Google Maps
                </p>
            )}
        </div>
    )
}
