'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginCard() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const submit = async () => {
        setError(null)
        setLoading(true)
        try {
            console.log('🔍 Cercando utente con email:', email)
            const res = await fetch('/api/users')
            const users = await res.json()
            console.log('📋 Utenti nel sistema:', users.length, users.map((u: any) => u.email))

            const found = (users || []).find((u: any) => u.email && u.email.toString().toLowerCase() === email.trim().toLowerCase())

            if (!found) {
                setError('❌ Utente non trovato. Crea un account.')
                setLoading(false)
                return
            }

            console.log('✅ Utente trovato:', found)
            localStorage.setItem('currentUserId', String(found.id))
            localStorage.setItem('currentUserName', `${found.firstName} ${found.lastName}`)
            localStorage.setItem('currentUserEmail', String(found.email))
            localStorage.setItem('currentUserUsername', found.username || '')

            // Redirect diretto senza reload
            window.location.href = '/home'
        } catch (e: any) {
            console.error('❌ Errore login:', e)
            setError('❌ Errore durante il login. Riprova.')
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && email.trim()) {
            submit()
        }
    }

    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Login</h1>
            <p className="text-sm text-gray-600 mb-6">Inserisci la tua email per accedere.</p>

            <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="example@email.com"
                type="email"
                disabled={loading}
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
            />

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={submit}
                    disabled={loading || !email.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition"
                >
                    {loading ? '⏳ Accesso in corso...' : '✓ Login'}
                </button>
            </div>

            <div className="mt-4 text-center">
                <Link href="/create-profile" className="text-sm text-green-600 underline hover:text-green-800">
                    Non sei ancora registrato? Crea account
                </Link>
            </div>

            <div className="mt-6 p-3 bg-green-50 rounded-lg text-xs text-gray-600">
                <p className="font-semibold mb-1">💡 Demo: Email salvate nel JSON</p>
                <p>Usa l'email con cui hai creato il profilo (es: simone.lima97@gmail.com)</p>
            </div>
        </div>
    )
}
