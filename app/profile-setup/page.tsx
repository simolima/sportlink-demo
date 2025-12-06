'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SPORTS, PROFESSIONAL_ROLES, type Sport, type ProfessionalRole } from '@/lib/types'

export default function ProfileSetupPage() {
    const router = useRouter()
    const [sport, setSport] = useState<Sport | ''>('')
    const [professionalRole, setProfessionalRole] = useState<ProfessionalRole | ''>('')
    const [availability, setAvailability] = useState<'Disponibile' | 'Non disponibile' | 'Valuta proposte'>('Valuta proposte')
    const [level, setLevel] = useState('')
    const [currentClub, setCurrentClub] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }
        setCurrentUserId(id)
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!sport || !professionalRole) {
            setError('Sport e ruolo professionale sono obbligatori')
            return
        }



        setLoading(true)

        try {
            // Recupera dati utente esistenti
            const usersRes = await fetch('/api/users')
            const users = await usersRes.json()
            const currentUser = users.find((u: any) => u.id.toString() === currentUserId)

            if (!currentUser) {
                throw new Error('Utente non trovato')
            }

            // Aggiorna profilo con nuovi campi
            const updatedUser = {
                ...currentUser,
                sport,
                professionalRole,
                availability,
                level: level || undefined,
                currentClub: currentClub || undefined,
            }

            // Salva aggiornamento
            const updateRes = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser),
            })

            if (!updateRes.ok) {
                throw new Error('Errore durante il salvataggio')
            }

            // Redirect a dashboard/home
            router.push('/home')
        } catch (err: any) {
            setError(err.message || 'Errore durante il salvataggio del profilo')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => {
        router.push('/home')
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Completa il tuo profilo</h1>
                        <p className="text-gray-600">
                            Aiutaci a connetterti con le opportunità giuste selezionando il tuo sport e ruolo professionale
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sport */}
                        <div>
                            <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
                                Sport <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="sport"
                                value={sport}
                                onChange={(e) => setSport(e.target.value as Sport)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                <option value="">Seleziona uno sport</option>
                                {SPORTS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ruolo Professionale */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                Ruolo Professionale <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="role"
                                value={professionalRole}
                                onChange={(e) => setProfessionalRole(e.target.value as ProfessionalRole)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                <option value="">Seleziona un ruolo</option>
                                {PROFESSIONAL_ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {/* Disponibilità */}
                        <div>
                            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                                Disponibilità
                            </label>
                            <select
                                id="availability"
                                value={availability}
                                onChange={(e) => setAvailability(e.target.value as any)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="Disponibile">Disponibile</option>
                                <option value="Non disponibile">Non disponibile</option>
                                <option value="Valuta proposte">Valuta proposte</option>
                            </select>
                        </div>

                        {/* Livello (opzionale) */}
                        <div>
                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                                Livello (opzionale)
                            </label>
                            <input
                                type="text"
                                id="level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                placeholder="es. Professionista, Semi-pro, Dilettante"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Club Attuale (opzionale) */}
                        <div>
                            <label htmlFor="currentClub" className="block text-sm font-medium text-gray-700 mb-2">
                                Club/Squadra Attuale (opzionale)
                            </label>
                            <input
                                type="text"
                                id="currentClub"
                                value={currentClub}
                                onChange={(e) => setCurrentClub(e.target.value)}
                                placeholder="es. AC Milan, NBA Lakers"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Salta per ora
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-sprinta-blue text-white rounded-lg hover:bg-sprinta-blue-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Salvataggio...' : 'Completa Profilo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
