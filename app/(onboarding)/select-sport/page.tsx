"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_SPORTS, isMultiSportRole } from '@/utils/roleHelpers'
import { ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { createUser } from '@/lib/services/auth-service'
import { setCurrentUserSession, clearSignupDraft } from '@/lib/services/session'

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
        // Prevenzione doppio submit
        if (isLoading) return

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
            const professionalRole = role as ProfessionalRole
            const sports = selectedSports

            // Crea l'utente via service
            const newUser = await createUser({
                firstName,
                lastName,
                email,
                password,
                birthDate,
                professionalRole,
                sports,
                verified: false
            })

            // Salva dati utente per la sessione
            setCurrentUserSession({
                id: String(newUser.id),
                email: newUser.email,
                name: `${newUser.firstName} ${newUser.lastName}`,
                avatar: newUser.avatarUrl || '',
                role: newUser.professionalRole,
            })
            // Pulisci i dati temporanei di signup
            clearSignupDraft()
            // Vai alla home
            window.location.replace('/home')
        } catch (err: any) {
            console.error('Signup error:', err)
            // Mostra messaggio errore più specifico
            if (err.message.includes('email')) {
                setError('Email non valida o già in uso. Prova con un\'altra email.')
            } else {
                setError('Errore nella creazione del profilo. Riprova.')
            }
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-base-200 rounded-2xl shadow-xl p-8 md:p-12 border border-base-300">
                    {/* Header */}
                    <OnboardingHeader
                        title="Qual è il tuo sport principale?"
                        subtitle="Lo useremo per mostrarti persone e opportunità più rilevanti."
                        currentStep={2}
                    />

                    {error && (
                        <div className="mb-6 p-4 bg-error/20 border border-error/40 rounded-lg text-error">
                            {error}
                        </div>
                    )}

                    {/* Sport Grid */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">Seleziona uno sport</h2>
                            <p className="text-secondary text-sm">Potrai aggiungere altri sport in seguito.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SUPPORTED_SPORTS.map((sport) => (
                                <button
                                    key={sport}
                                    onClick={() => handleSelectSport(sport)}
                                    disabled={isLoading}
                                    className={`p-6 rounded-xl border-2 transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selectedSports.includes(sport)
                                        ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                        : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="text-4xl mb-3">
                                        {sport === 'Calcio' && '⚽'}
                                        {sport === 'Basket' && '🏀'}
                                        {sport === 'Pallavolo' && '🏐'}
                                    </div>
                                    <div className="font-semibold text-white">{sport}</div>
                                </button>
                            ))}
                        </div>

                        {/* Conferma finale */}
                        <div className="pt-4 flex flex-col gap-4">
                            {selectedSports.length === 0 && (
                                <p className="text-xs text-secondary/70 text-center sm:text-right">Seleziona un'opzione per continuare.</p>
                            )}
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('currentUserRole')
                                        router.push('/profile-setup')
                                    }}
                                    disabled={isLoading}
                                    className="btn btn-outline border-base-300 text-secondary hover:bg-base-300 hover:text-white font-semibold py-3 px-8 order-2 sm:order-1"
                                >
                                    ← Indietro
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading || selectedSports.length === 0}
                                    className="btn btn-primary font-semibold py-3 px-10 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                            Creazione profilo…
                                        </span>
                                    ) : (
                                        'Completa profilo'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="mt-8 text-center">
                            <div className="inline-block">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                            </div>
                            <p className="text-secondary mt-3">Creazione profilo in corso...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
