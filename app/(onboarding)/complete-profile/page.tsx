"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'

export default function CompleteProfilePage() {
    const router = useRouter()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || checked) return
        setChecked(true)

        // Check if this is OAuth flow
        const currentUserId = localStorage.getItem('currentUserId')

        if (!currentUserId) {
            console.log('❌ Missing userId, redirecting to login...')
            router.replace('/login')
            return
        }

        // Pre-fill with data from Google if available
        const oauthFirstName = localStorage.getItem('oauth_firstName') || ''
        const oauthLastName = localStorage.getItem('oauth_lastName') || ''

        console.log('📝 Pre-filling form:', { oauthFirstName, oauthLastName })

        setFirstName(oauthFirstName)
        setLastName(oauthLastName)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!firstName.trim() || !lastName.trim()) {
            setError('Nome e cognome sono obbligatori')
            return
        }

        if (!birthDate) {
            setError('Data di nascita è obbligatoria')
            return
        }

        // Validate age (must be at least 13 years old)
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }

        if (age < 13) {
            setError('Devi avere almeno 13 anni per registrarti')
            return
        }

        if (age > 120) {
            setError('Data di nascita non valida')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Update localStorage with complete profile data
            localStorage.setItem('oauth_firstName', firstName.trim())
            localStorage.setItem('oauth_lastName', lastName.trim())
            localStorage.setItem('oauth_birthDate', birthDate)
            localStorage.setItem('currentUserName', `${firstName.trim()} ${lastName.trim()}`)

            console.log('✅ Profile data saved, redirecting to role selection')

            // Redirect to role selection
            router.push('/profile-setup?oauth=true')
        } catch (err) {
            console.error('Error:', err)
            setError('Si è verificato un errore')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-base-200 rounded-2xl shadow-xl p-8 md:p-12 border border-base-300">
                    {/* Header */}
                    <OnboardingHeader
                        title="Completa il tuo profilo"
                        subtitle="Verifica o inserisci i tuoi dati personali"
                        currentStep={1}
                        totalSteps={3}
                    />

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        {error && (
                            <div className="bg-error/20 border border-error/40 rounded-lg p-4">
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-base-300 border border-base-300 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-500"
                                    placeholder="Es. Marco"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                                    Cognome *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 bg-base-300 border border-base-300 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-500"
                                    placeholder="Es. Rossi"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-white mb-2">
                                    Data di nascita *
                                </label>
                                <input
                                    type="date"
                                    id="birthDate"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-base-300 border border-base-300 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    required
                                    disabled={loading}
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                                />
                                <p className="text-secondary text-xs mt-1">Devi avere almeno 13 anni</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="flex-1 px-6 py-3 border-2 border-base-300 text-white rounded-lg font-medium hover:bg-base-300 transition-colors"
                                disabled={loading}
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !firstName.trim() || !lastName.trim() || !birthDate}
                            >
                                {loading ? 'Salvataggio...' : 'Continua'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
