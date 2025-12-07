"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const SPORTS = [
    { id: 'calcio', label: 'Calcio', emoji: '⚽' },
    { id: 'basket', label: 'Basket', emoji: '🏀' },
    { id: 'tennis', label: 'Tennis', emoji: '🎾' },
    { id: 'pallavolo', label: 'Pallavolo', emoji: '🏐' },
    { id: 'rugby', label: 'Rugby', emoji: '🏉' },
    { id: 'nuoto', label: 'Nuoto', emoji: '🏊' },
    { id: 'atletica', label: 'Atletica', emoji: '🏃' },
    { id: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
    { id: 'judo', label: 'Judo', emoji: '🥋' },
    { id: 'taekwondo', label: 'Taekwondo', emoji: '🥋' },
    { id: 'boxe', label: 'Boxe', emoji: '🥊' },
    { id: 'scherma', label: 'Scherma', emoji: '🤺' },
    { id: 'golf', label: 'Golf', emoji: '⛳' },
    { id: 'sci', label: 'Sci', emoji: '⛷️' },
    { id: 'equitazione', label: 'Equitazione', emoji: '🐴' },
    { id: 'altro', label: 'Altro', emoji: '🏅' },
]

export default function SelectSportPage() {
    const router = useRouter()
    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || checked) return;
        setChecked(true)
        // Controlla che i dati di registrazione siano presenti
        const firstName = localStorage.getItem('signup_firstName')
        const lastName = localStorage.getItem('signup_lastName')
        const email = localStorage.getItem('signup_email')
        const password = localStorage.getItem('signup_password')
        const birthDate = localStorage.getItem('signup_birthDate')
        const sport = localStorage.getItem('currentUserSport')
        const currentUserId = localStorage.getItem('currentUserId')

        if (!firstName || !lastName || !email || !password || !birthDate) {
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserSport')
            if (currentUserId) {
                router.replace('/home')
            } else {
                router.replace('/signup')
            }
            return
        }
        // Se lo sport è già stato selezionato, vai a profile-setup
        if (sport) {
            router.replace('/profile-setup')
            return
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked])

    const handleSelectSport = async (sportId: string) => {
        setSelectedSport(sportId)
        setIsLoading(true)
        setError(null)

        try {
            // Salva lo sport in localStorage
            localStorage.setItem('currentUserSport', sportId)
            // Vai al prossimo step
            router.push('/profile-setup')
        } catch (err) {
            setError('Errore sconosciuto')
            setIsLoading(false)
            setSelectedSport(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/logo.svg" alt="SPRINTA" width={32} height={32} className="rounded" />
                        <h1 className="text-2xl font-bold text-gray-900">SPRINTA</h1>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Seleziona il tuo sport</h2>
                    <p className="text-gray-600 mt-2">Quale sport pratichi principalmente?</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Sport Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {SPORTS.map((sport) => (
                        <button
                            key={sport.id}
                            onClick={() => handleSelectSport(sport.id)}
                            disabled={isLoading}
                            className={`p-6 rounded-xl border-2 transition-all text-center ${selectedSport === sport.id
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-green-300'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="text-4xl mb-2">{sport.emoji}</div>
                            <div className="font-medium text-gray-900 text-sm">{sport.label}</div>
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="mt-8 text-center">
                        <div className="inline-block">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                        </div>
                        <p className="text-gray-600 mt-3">Salvataggio in corso...</p>
                    </div>
                )}

                {/* Help Text */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Info</h3>
                    <p className="text-blue-800 text-sm">
                        Potrai modificare lo sport dal tuo profilo in seguito. Per ora scegli lo sport principale.
                    </p>
                </div>
            </div>
        </div>
    )
}
