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
            localStorage.setItem('currentUserRole', found.professionalRole || '')

            // Salva sports (array) o sport (legacy)
            const userSports = found.sports || []
            localStorage.setItem('currentUserSports', JSON.stringify(userSports))
            localStorage.setItem('currentUserSport', userSports[0] || found.sport || '')

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
        <div className="w-full max-w-md">
            <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="example@email.com"
                type="email"
                disabled={loading}
                className="w-full p-3 border-2 border-white/20 bg-white/10 text-white rounded-lg mb-4 focus:border-sprinta-blue focus:outline-none disabled:opacity-50 placeholder:text-white/50"
            />

            {error && (
                <div className="bg-red-500/20 border-l-4 border-red-500 text-white p-3 mb-4 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={submit}
                    disabled={loading || !email.trim()}
                    className="flex-1 bg-sprinta-blue hover:bg-sprinta-blue-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition"
                >
                    {loading ? '⏳ Accesso in corso...' : '✓ Login'}
                </button>
            </div>

            <div className="mt-4 text-center">
                <Link href="/create-profile" className="text-sm text-white underline hover:text-white/80">
                    Non sei ancora registrato? Crea account
                </Link>
            </div>

            <div className="mt-6 p-3 bg-white/10 border border-white/20 rounded-lg text-xs text-white/80">
                <p className="font-semibold mb-1 text-white">💡 Demo: Email salvate nel JSON</p>
                <p>Usa l'email con cui hai creato il profilo (es: simone.lima97@gmail.com)</p>
            </div>
        </div>
    )
}
