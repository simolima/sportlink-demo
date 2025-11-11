'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginCard() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const submit = async () => {
        setError(null)
        try {
            const res = await fetch('/api/users')
            const users = await res.json()
            const found = (users || []).find((u: any) => u.email && u.email.toString().toLowerCase() === email.trim().toLowerCase())
            if (!found) { setError('Utente non trovato. Crea un profilo.'); return }
            localStorage.setItem('currentUserId', String(found.id))
            localStorage.setItem('currentUserName', `${found.firstName} ${found.lastName}`)
            localStorage.setItem('currentUserEmail', String(found.email))
            router.push('/')
            setTimeout(() => location.reload(), 200)
        } catch (e: any) {
            setError('Errore login')
        }
    }

    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">Login</h1>
            <p className="text-sm text-gray-600 mb-4">Inserisci la tua email per accedere alla demo.</p>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded mb-3" />
            <div className="flex gap-2">
                <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Login</button>
                <Link href="/create-profile" className="px-4 py-2 border rounded">Crea profilo</Link>
            </div>
            {error && <div className="text-red-600 mt-3">{error}</div>}
        </div>
    )
}
