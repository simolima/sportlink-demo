"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'

export default function CompleteProfilePage() {
    const router = useRouter()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
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

        setLoading(true)
        setError('')

        try {
            // Update localStorage with complete name data
            localStorage.setItem('oauth_firstName', firstName.trim())
            localStorage.setItem('oauth_lastName', lastName.trim())
            localStorage.setItem('currentUserName', `${firstName.trim()} ${lastName.trim()}`)

            console.log('✅ Name data saved, redirecting to profile setup')

            // Redirect to role selection
            router.push('/profile-setup?oauth=true')
        } catch (err) {
            console.error('Error:', err)
            setError('Si è verificato un errore')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <OnboardingHeader
                title="Completa il tuo profilo"
                subtitle="Verifica o inserisci il tuo nome completo"
                currentStep={1}
                totalSteps={3}
            />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Completa il tuo profilo
                        </h1>
                        <p className="text-gray-600">
                            Verifica o inserisci il tuo nome completo
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                Nome *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Es. Marco"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                Cognome *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Es. Rossi"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Indietro
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !firstName.trim() || !lastName.trim()}
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
