'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import {
    OPPORTUNITY_TYPES,
    SUPPORTED_SPORTS,
    PROFESSIONAL_ROLES,
    CONTRACT_TYPES,
    LEVELS
} from '@/lib/types'
import { useToast } from '@/lib/toast-context'
import { useRequireAuth } from '@/lib/hooks/useAuth'

interface Club {
    id: number | string
    name: string
    logoUrl?: string
    sport?: string
    city?: string
}

interface ClubMembership {
    clubId: string | number
    userId: string | number
    role: string
    club?: Club
}

/**
 * Pagina creazione opportunità
 * 
 * URL: /opportunities/new?clubId=<id> (opzionale)
 * 
 * Se clubId è presente, precompila la società.
 * Altrimenti mostra una select con i club di cui l'utente è membro con permessi.
 */
export default function CreateOpportunityPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isLoading: authLoading } = useRequireAuth(false)
    const { showToast } = useToast()

    const preselectedClubId = searchParams.get('clubId')

    const [userClubs, setUserClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const [form, setForm] = useState({
        clubId: preselectedClubId || '',
        title: '',
        type: 'Player Search',
        sport: '',
        roleRequired: 'Player',
        position: '',
        description: '',
        location: '',
        city: '',
        country: 'Italia',
        salary: '',
        contractType: '',
        level: '',
        requirements: '',
        expiryDate: ''
    })

    const currentUserId = user?.id ? String(user.id) : null

    // Fetch club dell'utente
    useEffect(() => {
        const fetchUserClubs = async () => {
            if (!currentUserId) return
            setLoading(true)

            try {
                // Fetch memberships dell'utente
                const membershipsRes = await fetch(`/api/club-memberships?userId=${currentUserId}`)
                const memberships: ClubMembership[] = await membershipsRes.json()

                // Filtra per ruoli con permessi di creazione (DS, President, Admin, etc.)
                const allowedRoles = ['Sporting Director', 'President', 'Admin', 'Director', 'Manager', 'Owner']
                const validMemberships = memberships.filter((m: ClubMembership) =>
                    allowedRoles.some(role => m.role?.toLowerCase().includes(role.toLowerCase()))
                )

                // Fetch dettagli club
                const clubsRes = await fetch('/api/clubs')
                const allClubs: Club[] = await clubsRes.json()

                const userClubsList = validMemberships
                    .map((m: ClubMembership) => allClubs.find((c: Club) => String(c.id) === String(m.clubId)))
                    .filter(Boolean) as Club[]

                setUserClubs(userClubsList)

                // Se c'è un clubId preselezionato e l'utente ne fa parte, precompila
                if (preselectedClubId) {
                    const preselectedClub = userClubsList.find((c: Club) => String(c.id) === preselectedClubId)
                    if (preselectedClub) {
                        setForm(prev => ({
                            ...prev,
                            clubId: String(preselectedClub.id),
                            sport: preselectedClub.sport || ''
                        }))
                    }
                }
            } catch (error) {
                console.error('Error fetching user clubs:', error)
                showToast('error', 'Errore', 'Impossibile caricare i tuoi club')
            } finally {
                setLoading(false)
            }
        }

        fetchUserClubs()
    }, [currentUserId, preselectedClubId])

    // Aggiorna sport quando si seleziona un club
    const handleClubChange = (clubId: string) => {
        setForm(prev => ({ ...prev, clubId }))
        const selectedClub = userClubs.find(c => String(c.id) === clubId)
        if (selectedClub?.sport) {
            setForm(prev => ({ ...prev, sport: selectedClub.sport || '' }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.clubId) {
            showToast('error', 'Errore', 'Seleziona una società')
            return
        }

        if (!form.title || !form.type || !form.sport || !form.roleRequired || !form.description || !form.expiryDate) {
            showToast('error', 'Errore', 'Compila tutti i campi obbligatori')
            return
        }

        // Validazione data scadenza
        const expiry = new Date(form.expiryDate)
        if (expiry <= new Date()) {
            showToast('error', 'Errore', 'La data di scadenza deve essere nel futuro')
            return
        }

        setCreating(true)

        try {
            const res = await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    createdBy: currentUserId,
                    isActive: true
                })
            })

            if (res.ok) {
                showToast('success', 'Opportunità creata!', 'L\'opportunità è stata pubblicata con successo')
                // Redirect alla tab "Per i miei club"
                router.push('/opportunities?tab=my-clubs')
            } else {
                const error = await res.json()
                showToast('error', 'Errore', error.error || 'Impossibile creare l\'opportunità')
            }
        } catch (error) {
            showToast('error', 'Errore', 'Si è verificato un errore')
        } finally {
            setCreating(false)
        }
    }

    // Auth check
    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!currentUserId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Devi essere loggato per creare opportunità.</p>
            </div>
        )
    }

    const selectedClub = userClubs.find(c => String(c.id) === form.clubId)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/opportunities?tab=my-clubs"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Torna alle opportunità</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea nuova opportunità</h1>
                    <p className="text-gray-600">Pubblica un'opportunità per uno dei tuoi club</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-gray-500">Caricamento club...</p>
                    </div>
                ) : userClubs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun club disponibile</h3>
                        <p className="text-gray-600 mb-4">
                            Non fai parte di nessun club con permessi per creare opportunità.
                        </p>
                        <Link
                            href="/clubs"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2341F0] text-white rounded-lg hover:bg-[#3B52F5]"
                        >
                            Esplora club
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sezione Società */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 size={20} className="text-[#2341F0]" />
                                Società
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleziona club *
                                </label>
                                <select
                                    value={form.clubId}
                                    onChange={(e) => handleClubChange(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent text-gray-900"
                                >
                                    <option value="">Seleziona un club</option>
                                    {userClubs.map(club => (
                                        <option key={club.id} value={String(club.id)}>
                                            {club.name} {club.sport ? `(${club.sport})` : ''} {club.city ? `- ${club.city}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedClub && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                                    {selectedClub.logoUrl ? (
                                        <img src={selectedClub.logoUrl} alt={selectedClub.name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#2341F0]/10 flex items-center justify-center">
                                            <Building2 size={24} className="text-[#2341F0]" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedClub.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {selectedClub.sport} {selectedClub.city ? `• ${selectedClub.city}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sezione Dettagli */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase size={20} className="text-[#2341F0]" />
                                Dettagli opportunità
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Titolo *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                        placeholder="Es: Cercasi centrocampista per Prima Squadra"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo opportunità *
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    >
                                        {OPPORTUNITY_TYPES.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sport *
                                    </label>
                                    <select
                                        value={form.sport}
                                        onChange={(e) => setForm(prev => ({ ...prev, sport: e.target.value }))}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    >
                                        <option value="">Seleziona</option>
                                        {SUPPORTED_SPORTS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ruolo richiesto *
                                    </label>
                                    <select
                                        value={form.roleRequired}
                                        onChange={(e) => setForm(prev => ({ ...prev, roleRequired: e.target.value }))}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    >
                                        {PROFESSIONAL_ROLES.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Posizione specifica
                                    </label>
                                    <input
                                        type="text"
                                        value={form.position}
                                        onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))}
                                        placeholder="Es: Ala destra, Pivot, ecc."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Livello
                                    </label>
                                    <select
                                        value={form.level}
                                        onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    >
                                        <option value="">Seleziona</option>
                                        {LEVELS.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo contratto
                                    </label>
                                    <select
                                        value={form.contractType}
                                        onChange={(e) => setForm(prev => ({ ...prev, contractType: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    >
                                        <option value="">Seleziona</option>
                                        {CONTRACT_TYPES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Località *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                                        required
                                        placeholder="Es: Milano"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Città
                                    </label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="Es: Milano"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Compenso
                                    </label>
                                    <input
                                        type="text"
                                        value={form.salary}
                                        onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
                                        placeholder="Es: Da definire, Volontariato, €500/mese"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Data scadenza *
                                    </label>
                                    <input
                                        type="date"
                                        value={form.expiryDate}
                                        onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrizione *
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        required
                                        rows={4}
                                        placeholder="Descrivi l'opportunità, le responsabilità e cosa cerchi..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Requisiti
                                    </label>
                                    <textarea
                                        value={form.requirements}
                                        onChange={(e) => setForm(prev => ({ ...prev, requirements: e.target.value }))}
                                        rows={3}
                                        placeholder="Esperienza richiesta, certificazioni, disponibilità..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2341F0] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/opportunities?tab=my-clubs"
                                className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Annulla
                            </Link>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-8 py-3 bg-[#2341F0] text-white font-semibold rounded-lg hover:bg-[#3B52F5] disabled:opacity-50 transition-colors"
                            >
                                {creating ? 'Creazione...' : 'Pubblica opportunità'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
