"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SUPPORTED_SPORTS, isMultiSportRole } from '@/utils/roleHelpers'
import { ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'
import { useAuth } from '@/lib/hooks/useAuth'

export default function CompleteProfilePage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const [selectedSports, setSelectedSports] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (checked || isLoading) return
        setChecked(true)

        // Se l'utente non è loggato, vai a login
        if (!user) {
            router.replace('/login')
            return
        }

        // Se l'utente ha già sport, vai a home
        if (user.sports && user.sports.length > 0) {
            router.replace('/home')
            return
        }
    }, [checked, user, isLoading, router])

    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    const handleSelectSport = (sport: string) => {
        if (user && isMultiSportRole(user.professionalRole as ProfessionalRole)) {
            setSelectedSports((prev) => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
        } else {
            setSelectedSports([sport])
        }
    }

    const handleConfirm = async () => {
        if (selectedSports.length === 0) {
            setError('Devi selezionare almeno uno sport')
            return
        }

        setIsSaving(true)
        setError(null)
        try {
            // Aggiorna il profilo dell'utente via API
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user?.id,
                    sports: selectedSports,
                })
            })

            if (!res.ok) {
                setError('Errore durante il salvataggio del profilo')
                setIsSaving(false)
                return
            }

            // Aggiorna localStorage
            localStorage.setItem('currentUserSports', JSON.stringify(selectedSports))

            // Vai alla home con hard reload per forzare refresh della sessione
            window.location.href = '/home'
        } catch (err) {
            setError('Errore durante il salvataggio del profilo')
            setIsSaving(false)
        }
    }

    if (isLoading || !user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/logo.svg" alt="SPRINTA" width={32} height={32} className="rounded" />
                        <h1 className="text-2xl font-bold text-gray-900">SPRINTA</h1>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Completa il tuo profilo</h2>
                    <p className="text-gray-600 mt-2">Quale sport gestisci/pratichi?</p>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {SUPPORTED_SPORTS.map((sport) => (
                        <button
                            key={sport}
                            onClick={() => handleSelectSport(sport)}
                            disabled={isSaving}
                            className={`p-6 rounded-xl border-2 transition-all text-center ${selectedSports.includes(sport)
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 bg-white hover:border-primary/30'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="text-4xl mb-2">
                                {sport === 'Calcio' && '⚽'}
                                {sport === 'Basket' && '🏀'}
                                {sport === 'Pallavolo' && '🏐'}
                            </div>
                            <div className="font-semibold text-gray-900">{sport}</div>
                        </button>
                    ))}
                </div>

                {/* Bottoni di azione */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => router.back()}
                        disabled={isSaving}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Indietro
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving || selectedSports.length === 0}
                        className="bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isSaving ? 'Salvataggio...' : 'Salva e continua'}
                    </button>
                </div>
            </div>
        </div>
    )
}
