"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginFormPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const success = await login(email, password)
            if (!success) {
                setError('Email o password non validi')
                setLoading(false)
                return
            }

            router.push('/home')
        } catch (err) {
            setError('Errore durante l\'accesso. Riprova.')
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: '#0A0F32' }}
        >
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                                style={{
                                    '--tw-ring-color': '#2341F0'
                                } as React.CSSProperties}
                                placeholder="tuo@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12"
                                    style={{
                                        '--tw-ring-color': '#2341F0'
                                    } as React.CSSProperties}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#2341F0' }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3B52F5')}
                            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2341F0')}
                        >
                            {loading ? 'Accesso in corso...' : 'Accedi'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: '#2341F0', opacity: 0.05, borderColor: '#2341F0' }}>
                        <div style={{ opacity: 1 / 0.05 }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: '#2341F0' }}>🧪 Credenziali Demo:</p>
                            <p className="text-xs text-gray-600">Email: <code className="bg-white px-1 rounded">marco.rossi@sprinta.com</code></p>
                            <p className="text-xs text-gray-600">Password: <code className="bg-white px-1 rounded">demo123</code></p>
                        </div>
                    </div>

                    {/* Sign up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Non hai un account?{' '}
                            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#2341F0' }}>
                                Registrati
                            </Link>
                        </p>
                    </div>

                    {/* Back to landing */}
                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Torna alla pagina iniziale
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
