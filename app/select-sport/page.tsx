"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SUPPORTED_SPORTS, isMultiSportRole } from '@/utils/roleHelpers'
import { ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'

export default function SelectSportPage() {
    const router = useRouter()
    const [selectedSports, setSelectedSports] = useState<string[]>([])
    const [role, setRole] = useState<ProfessionalRole | null>(null)
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
        const currentUserRole = localStorage.getItem('currentUserRole') as ProfessionalRole | null
        const currentUserId = localStorage.getItem('currentUserId')

        if (!firstName || !lastName || !email || !password || !birthDate || !currentUserRole) {
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserRole')
            if (currentUserId) {
                router.replace('/home')
            } else {
                router.replace('/signup')
            }
            return
        }
        setRole(currentUserRole)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked])

    const handleSelectSport = (sport: string) => {
        if (role && isMultiSportRole(role)) {
            setSelectedSports((prev) => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
        } else {
            setSelectedSports([sport])
        }
    }

    const handleConfirm = async () => {
        setIsLoading(true)
        setError(null)
        try {
            // Salva gli sport in localStorage
            localStorage.setItem('currentUserSports', JSON.stringify(selectedSports))
            // Recupera tutti i dati dal localStorage
            const firstName = localStorage.getItem('signup_firstName') || ''
            const lastName = localStorage.getItem('signup_lastName') || ''
            const email = localStorage.getItem('signup_email') || ''
            const password = localStorage.getItem('signup_password') || ''
            const birthDate = localStorage.getItem('signup_birthDate') || ''
            const professionalRole = role || ''
            const sports = selectedSports

            // Crea l'utente via API
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    birthDate,
                    professionalRole,
                    sports,
                    verified: false
                })
            })
            if (!res.ok) {
                setError('Errore durante la creazione del profilo')
                setIsLoading(false)
                return
            }
            const newUser = await res.json()
            // Salva dati utente per la sessione
            localStorage.setItem('currentUserId', String(newUser.id))
            localStorage.setItem('currentUserEmail', newUser.email)
            localStorage.setItem('currentUserName', `${newUser.firstName} ${newUser.lastName}`)
            localStorage.setItem('currentUserAvatar', newUser.avatarUrl || '')
            // Pulisci i dati temporanei
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserRole')
            // Vai alla home
            window.location.replace('/home')
        } catch (err) {
            setError('Errore durante la creazione del profilo')
        } finally {
            setIsLoading(false)
        }
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
                    {SUPPORTED_SPORTS.map((sport) => (
                        <button
                            key={sport}
                            onClick={() => handleSelectSport(sport)}
                            disabled={isLoading}
                            className={`p-6 rounded-xl border-2 transition-all text-center ${selectedSports.includes(sport)
                                ? 'border-primary bg-base-300'
                                : 'border-base-300 bg-base-200 hover:border-primary'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="text-4xl mb-2">
                                {sport === 'Calcio' && '⚽'}
                                {sport === 'Basket' && '🏀'}
                                {sport === 'Pallavolo' && '🏐'}
                            </div>
                            <div className="font-medium text-gray-900 text-sm">{sport}</div>
                        </button>
                    ))}
                </div>

                {/* Conferma finale */}
                <div className="mt-8 flex justify-between gap-4">
                    <button
                        onClick={() => {
                            localStorage.removeItem('currentUserRole')
                            router.push('/profile-setup')
                        }}
                        disabled={isLoading}
                        className="border border-gray-300 bg-white text-gray-700 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Indietro
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || selectedSports.length === 0}
                        className="btn btn-primary"
                    >
                        {isLoading ? 'Salvataggio...' : 'Completa Profilo →'}
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="mt-8 text-center">
                        <div className="inline-block">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
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
