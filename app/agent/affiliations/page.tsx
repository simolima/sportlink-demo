'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Send } from 'lucide-react'
import { Affiliation } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface AffiliationWithDetails extends Affiliation {
    player?: { id: number; firstName: string; lastName: string; avatarUrl?: string; sport?: string }
}

export default function AgentAffiliationsPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [affiliations, setAffiliations] = useState<AffiliationWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [players, setPlayers] = useState<any[]>([])
    const [selectedPlayerId, setSelectedPlayerId] = useState('')
    const [requestMessage, setRequestMessage] = useState('')

    useEffect(() => {
        const loadData = async () => {
            if (typeof window === 'undefined') return
            const userId = localStorage.getItem('currentUserId')
            if (!userId) {
                router.push('/login')
                return
            }

            try {
                // Fetch current user data
                const usersRes = await fetch('/api/users')
                const users = await usersRes.json()
                const user = users.find((u: any) => u.id.toString() === userId)

                if (!user) {
                    router.push('/login')
                    return
                }

                setCurrentUser(user)

                // Check if user is an agent
                if (user.professionalRole !== 'Agent') {
                    showToast('error', 'Accesso negato', 'Solo gli agenti possono accedere a questa pagina')
                    router.push('/home')
                    return
                }

                await fetchAffiliations(user.id)
                await fetchPlayers()
            } catch (error) {
                showToast('error', 'Errore', 'Impossibile caricare i dati')
            }
        }

        loadData()
    }, [])

    const fetchAffiliations = async (agentId: string) => {
        setLoading(true)
        try {
            const statusParam = filter !== 'all' ? `&status=${filter}` : ''
            const res = await fetch(`/api/affiliations?agentId=${agentId}${statusParam}`)
            const data = await res.json()
            setAffiliations(data)
        } catch (error) {
            showToast('error', 'Errore', 'Impossibile caricare le affiliazioni')
        } finally {
            setLoading(false)
        }
    }

    const fetchPlayers = async () => {
        try {
            const res = await fetch('/api/users')
            const users = await res.json()
            // Filter only players
            const playersList = users.filter((u: any) => u.professionalRole === 'Player')
            setPlayers(playersList)
        } catch (error) {
            console.error('Error fetching players:', error)
        }
    }

    const handleSendRequest = async () => {
        if (!selectedPlayerId) {
            showToast('error', 'Errore', 'Seleziona un giocatore')
            return
        }

        try {
            const res = await fetch('/api/affiliations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: currentUser.id,
                    playerId: selectedPlayerId,
                    notes: requestMessage,
                }),
            })

            if (res.ok) {
                showToast('success', 'Richiesta inviata!', 'La richiesta di affiliazione è stata inviata al giocatore')
                setShowRequestForm(false)
                setSelectedPlayerId('')
                setRequestMessage('')
                fetchAffiliations(currentUser.id)
            } else {
                const error = await res.json()
                showToast('error', 'Errore', error.error || 'Impossibile inviare la richiesta')
            }
        } catch (error) {
            showToast('error', 'Errore', 'Si è verificato un errore')
        }
    }

    const handleRemoveAffiliation = async (affiliationId: number) => {
        if (!confirm('Sei sicuro di voler rimuovere questa affiliazione?')) return

        try {
            const res = await fetch(`/api/affiliations?id=${affiliationId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                showToast('success', 'Affiliazione rimossa', 'L\'affiliazione è stata rimossa con successo')
                fetchAffiliations(currentUser.id)
            }
        } catch (error) {
            showToast('error', 'Errore', 'Impossibile rimuovere l\'affiliazione')
        }
    }

    useEffect(() => {
        if (currentUser) {
            fetchAffiliations(currentUser.id)
        }
    }, [filter])

    if (loading && !currentUser) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center py-12">Caricamento...</div>
            </div>
        )
    }

    const pendingAffiliations = affiliations.filter((a) => a.status === 'pending')
    const acceptedAffiliations = affiliations.filter((a) => a.status === 'accepted')
    const rejectedAffiliations = affiliations.filter((a) => a.status === 'rejected')

    const filteredAffiliations =
        filter === 'all'
            ? affiliations
            : filter === 'pending'
                ? pendingAffiliations
                : acceptedAffiliations

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Users size={32} className="text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Le Mie Affiliazioni</h1>
                            <p className="text-gray-600">Gestisci i giocatori affiliati</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setShowRequestForm(!showRequestForm)
                            if (!showRequestForm) {
                                fetchPlayers()
                            }
                        }}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <UserPlus size={20} />
                        Richiedi Affiliazione
                    </button>
                </div>

                {/* Request Form */}
                {showRequestForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-primary/20">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Send size={20} className="text-primary" />
                            Invia Richiesta di Affiliazione
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleziona Giocatore *
                                </label>
                                <select
                                    value={selectedPlayerId}
                                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">-- Seleziona un giocatore --</option>
                                    {players.map((player) => (
                                        <option key={player.id} value={player.id}>
                                            {player.firstName} {player.lastName} {player.sport && `- ${player.sport}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Messaggio (opzionale)
                                </label>
                                <textarea
                                    rows={4}
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Presenta te stesso e spiega perché vuoi rappresentare questo giocatore. Descrivi la tua esperienza, i tuoi contatti e come puoi aiutare la sua carriera..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRequestForm(false)
                                        setSelectedPlayerId('')
                                        setRequestMessage('')
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={!selectedPlayerId}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    Invia Richiesta
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Tutte ({affiliations.length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'pending'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Attesa ({pendingAffiliations.length})
                    </button>
                    <button
                        onClick={() => setFilter('accepted')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'accepted'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Accettate ({acceptedAffiliations.length})
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-warning/10 border-2 border-warning/30 rounded-lg p-4">
                    <p className="text-sm text-warning font-medium">Richieste in Attesa</p>
                    <p className="text-3xl font-bold text-warning mt-1">{pendingAffiliations.length}</p>
                </div>
                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-secondary font-medium">Giocatori Affiliati</p>
                    <p className="text-3xl font-bold text-secondary mt-1">{acceptedAffiliations.length}</p>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">Richieste Rifiutate</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">{rejectedAffiliations.length}</p>
                </div>
            </div>

            {/* Affiliations List */}
            {filteredAffiliations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Nessuna affiliazione da visualizzare</p>
                    {filter === 'all' && (
                        <button
                            onClick={() => setShowRequestForm(true)}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Invia la tua prima richiesta
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAffiliations.map((affiliation) => (
                        <div
                            key={affiliation.id}
                            className={`rounded-lg shadow-sm p-6 ${affiliation.status === 'pending'
                                ? 'bg-warning/5 border-2 border-warning/20'
                                : affiliation.status === 'accepted'
                                    ? 'bg-primary/5 border-2 border-primary/20'
                                    : 'bg-error/5 border-2 border-error/20'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <img
                                        src={affiliation.player?.avatarUrl || '/default-avatar.png'}
                                        alt={`${affiliation.player?.firstName} ${affiliation.player?.lastName}`}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {affiliation.player?.firstName} {affiliation.player?.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {affiliation.player?.sport || 'Sport non specificato'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Richiesta inviata il: {new Date(affiliation.requestedAt).toLocaleDateString('it-IT')}
                                        </p>
                                        {affiliation.status === 'accepted' && affiliation.affiliatedAt && (
                                            <p className="text-xs text-success font-medium mt-1">
                                                ✓ Affiliato dal: {new Date(affiliation.affiliatedAt).toLocaleDateString('it-IT')}
                                            </p>
                                        )}
                                        {affiliation.status === 'rejected' && affiliation.respondedAt && (
                                            <p className="text-xs text-red-700 font-medium mt-1">
                                                ✗ Rifiutata il: {new Date(affiliation.respondedAt).toLocaleDateString('it-IT')}
                                            </p>
                                        )}
                                        {affiliation.notes && (
                                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Il tuo messaggio:</span> {affiliation.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Status badge */}
                                    <span
                                        className={`px-4 py-2 rounded-full text-sm font-semibold ${affiliation.status === 'pending'
                                            ? 'bg-warning/20 text-warning'
                                            : affiliation.status === 'accepted'
                                                ? 'bg-success/20 text-success'
                                                : 'bg-error/20 text-error'
                                            }`}
                                    >
                                        {affiliation.status === 'pending'
                                            ? 'In Attesa'
                                            : affiliation.status === 'accepted'
                                                ? 'Accettata'
                                                : 'Rifiutata'}
                                    </span>

                                    {/* Actions */}
                                    {affiliation.status === 'accepted' && (
                                        <button
                                            onClick={() =>
                                                handleRemoveAffiliation(
                                                    typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id)
                                                )
                                            }
                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                                        >
                                            Rimuovi
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
