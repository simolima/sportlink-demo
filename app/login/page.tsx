"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, hasCompletedProfile } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect se già autenticato
    useEffect(() => {
        if (isAuthenticated) {
            const sport = localStorage.getItem('currentUserSport')
            const role = localStorage.getItem('currentUserRole')

            // Se ha completato tutto (sport + ruolo), vai a home
            if (sport && role && hasCompletedProfile) {
                router.push('/home')
            }
            // Se ha selezionato sport ma non ruolo, vai a profile-setup
            else if (sport && !role) {
                router.push('/profile-setup')
            }
            // Se non ha selezionato sport, vai a select-sport
            else if (!sport) {
                router.push('/select-sport')
            }
            // Altrimenti vai a profile-setup
            else {
                router.push('/profile-setup')
            }
        }
    }, [isAuthenticated, hasCompletedProfile, router])

    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const success = await login(email, password)
            if (success) {
                // Redirect gestito dall'useEffect sopra
            } else {
                setError('Email o password non corretti')
            }
        } catch (err) {
            setError('Errore durante il login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bentornato!</h2>
                        <p className="text-gray-600">Accedi al tuo account Sprinta</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="tuo@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Accesso in corso...' : 'Accedi'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs font-semibold text-green-800 mb-2">🧪 Credenziali Demo:</p>
                        <p className="text-xs text-green-700">Email: <code className="bg-white px-1 rounded">marco.rossi@sprinta.com</code></p>
                        <p className="text-xs text-green-700">Password: <code className="bg-white px-1 rounded">demo123</code></p>
                    </div>

                    {/* Sign up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Non hai un account?{' '}
                            <Link href="/signup" className="font-semibold text-green-600 hover:text-green-700">
                                Registrati
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
