'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Send } from 'lucide-react'
import { Affiliation } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface AffiliationWithDetails extends Affiliation {
    player?: { id: number; firstName: string; lastName: string; avatarUrl?: string; sport?: string }
}

export default function AgentAffiliationsPage() {
    // Tutti gli hook PRIMA di qualsiasi return condizionale
    const router = useRouter()
    const { showToast } = useToast()
    const [affiliations, setAffiliations] = useState<AffiliationWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [players, setPlayers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
    const [requestMessage, setRequestMessage] = useState('')
    const [modalStep, setModalStep] = useState<1 | 2>(1)
    const searchInputRef = useRef<HTMLInputElement>(null)

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

                // Blocca immediatamente se non è un agente (use role_id from DB, not professionalRole)
                if (user.role_id !== 'agent') {
                    showToast('error', 'Accesso negato', 'Solo gli agenti possono accedere a questa pagina')
                    setLoading(false)
                    router.push('/home')
                    return
                }

                setCurrentUser(user)
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
            const res = await fetch(`/api/affiliations?agentId=${agentId}`)
            const data = await res.json()

            // Ensure data is an array
            if (Array.isArray(data)) {
                setAffiliations(data)
            } else if (data.error) {
                console.error('API error:', data.error)
                showToast('error', 'Errore', data.error)
                setAffiliations([])
            } else {
                console.error('Unexpected response format:', data)
                setAffiliations([])
            }
        } catch (error) {
            console.error('Fetch error:', error)
            showToast('error', 'Errore', 'Impossibile caricare le affiliazioni')
            setAffiliations([])
        } finally {
            setLoading(false)
        }
    }

    const fetchPlayers = async () => {
        try {
            const res = await fetch('/api/users')
            const users = await res.json()
            // Filter only players (use role_id from DB, not professionalRole)
            const playersList = users.filter((u: any) => u.role_id === 'player')
            setPlayers(playersList)
            setFilteredPlayers(playersList)
        } catch (error) {
            console.error('Error fetching players:', error)
        }
    }

    const handleSendRequest = async () => {
        if (!selectedPlayer) {
            showToast('error', 'Errore', 'Seleziona un giocatore')
            return
        }
        try {
            const res = await fetch('/api/affiliations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: currentUser.id,
                    playerId: selectedPlayer.id,
                    notes: requestMessage,
                }),
            })
            if (res.ok) {
                showToast('success', 'Richiesta inviata!', 'La richiesta di affiliazione è stata inviata al giocatore')
                setShowRequestModal(false)
                setSelectedPlayer(null)
                setRequestMessage('')
                setModalStep(1)
                setSearchTerm('')
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
            const res = await fetch(`/api/affiliations?id=${affiliationId}&agentId=${currentUser.id}`, {
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
        if (showRequestModal && modalStep === 1 && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 200)
        }
    }, [showRequestModal, modalStep])




    // Filtra i giocatori in base al searchTerm (hook sempre prima dei return!)
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPlayers(players)
        } else {
            setFilteredPlayers(
                players.filter((p) =>
                    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        }
    }, [searchTerm, players])

    // Filtri derivati da affiliations per status/tab
    const pendingAffiliations = affiliations.filter((a) => a.status === 'pending')
    const acceptedAffiliations = affiliations.filter((a) => a.status === 'accepted')
    const rejectedAffiliations = affiliations.filter((a) => a.status === 'rejected')
    const filteredAffiliations =
        filter === 'all'
            ? affiliations
            : filter === 'pending'
                ? pendingAffiliations
                : acceptedAffiliations

    // --- DOPO tutti gli hook, ora i return condizionali ---
    if (loading && !currentUser) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center py-12">Caricamento...</div>
            </div>
        )
    }

    // Se l'utente non è agente, non mostrare nulla (prevenzione flash contenuti)
    if (currentUser && currentUser.role_id !== 'agent') {
        return null
    }

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
                            setShowRequestModal(true)
                            setModalStep(1)
                            setSelectedPlayer(null)
                            setRequestMessage('')
                            setSearchTerm('')
                            fetchPlayers()
                        }}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <UserPlus size={20} />
                        Richiedi Affiliazione
                    </button>
                </div>

                {/* MODAL: Richiedi Affiliazione */}
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-0 overflow-hidden animate-fade-in">
                            <div className="p-6 border-b flex items-center gap-2">
                                <Send size={20} className="text-primary" />
                                <span className="font-semibold text-lg">Richiedi Affiliazione</span>
                            </div>
                            <div className="p-6">
                                {modalStep === 1 && (
                                    <>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cerca un giocatore</label>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary mb-4"
                                            placeholder="Nome o cognome..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                        <div className="max-h-64 overflow-y-auto space-y-2">
                                            {filteredPlayers.length === 0 && (
                                                <div className="text-gray-400 text-center py-8">Nessun giocatore trovato</div>
                                            )}
                                            {filteredPlayers.map((player) => (
                                                <button
                                                    key={player.id}
                                                    className={`w-full flex items-center gap-4 p-3 rounded-lg border hover:bg-green-50 transition ${selectedPlayer?.id === player.id ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                                                    onClick={() => {
                                                        setSelectedPlayer(player)
                                                        setModalStep(2)
                                                    }}
                                                >
                                                    <img src={player.avatarUrl || '/default-avatar.png'} alt={player.firstName} className="w-10 h-10 rounded-full object-cover border" />
                                                    <div className="flex-1 text-left">
                                                        <div className="font-semibold">{player.firstName} {player.lastName}</div>
                                                        <div className="text-xs text-gray-500">{player.sport || 'Sport non specificato'}</div>
                                                        {/* Stato disponibilità futuro */}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {modalStep === 2 && selectedPlayer && (
                                    <>
                                        <div className="flex items-center gap-4 mb-4">
                                            <img src={selectedPlayer.avatarUrl || '/default-avatar.png'} alt={selectedPlayer.firstName} className="w-14 h-14 rounded-full object-cover border" />
                                            <div>
                                                <div className="font-semibold text-lg">{selectedPlayer.firstName} {selectedPlayer.lastName}</div>
                                                <div className="text-sm text-gray-500">{selectedPlayer.sport || 'Sport non specificato'}</div>
                                            </div>
                                        </div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Messaggio (opzionale)</label>
                                        <textarea
                                            rows={4}
                                            value={requestMessage}
                                            onChange={e => setRequestMessage(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary mb-4"
                                            placeholder="Presentati e spiega perché vuoi rappresentare questo giocatore"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setModalStep(1)
                                                    setSelectedPlayer(null)
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                Indietro
                                            </button>
                                            <button
                                                onClick={handleSendRequest}
                                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                            >
                                                <Send size={18} />
                                                Invia richiesta
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setShowRequestModal(false)
                                    setModalStep(1)
                                    setSelectedPlayer(null)
                                    setRequestMessage('')
                                    setSearchTerm('')
                                }}
                                className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
                                aria-label="Chiudi"
                            >✕</button>
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
                            onClick={() => {
                                setShowRequestModal(true)
                                setModalStep(1)
                                setSelectedPlayer(null)
                                setRequestMessage('')
                                setSearchTerm('')
                                fetchPlayers()
                            }}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition"
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
                                        className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${affiliation.status === 'pending'
                                            ? 'bg-warning/20 text-warning'
                                            : affiliation.status === 'accepted'
                                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                : 'bg-error/20 text-error'
                                            }`}
                                    >
                                        {affiliation.status === 'pending'
                                            ? 'In Attesa'
                                            : affiliation.status === 'accepted'
                                                ? <>✓ Accettata</>
                                                : 'Rifiutata'}
                                    </span>

                                    {/* Actions for pending */}
                                    {affiliation.status === 'pending' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Vuoi annullare questa richiesta?')) {
                                                    const res = await fetch('/api/affiliations', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: affiliation.id,
                                                            status: 'rejected'
                                                        }),
                                                    })
                                                    if (res.ok) {
                                                        showToast('success', 'Richiesta annullata', 'La richiesta è stata annullata con successo')
                                                        fetchAffiliations(currentUser.id)
                                                    } else {
                                                        showToast('error', 'Errore', 'Impossibile annullare la richiesta')
                                                    }
                                                }
                                            }}
                                            className="ml-2 px-3 py-1 text-warning border border-warning/40 rounded-lg bg-warning/10 hover:bg-warning/20 text-xs font-medium transition"
                                        >
                                            Annulla richiesta
                                        </button>
                                    )}

                                    {/* Actions for accepted */}
                                    {affiliation.status === 'accepted' && (
                                        <>
                                            <button
                                                onClick={() => router.push(`/messages/${affiliation.player?.id}`)}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-medium mr-2"
                                            >
                                                Messaggia
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleRemoveAffiliation(
                                                        typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id)
                                                    )
                                                }
                                                className="px-4 py-2 bg-red-50 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                                            >
                                                Rimuovi
                                            </button>
                                        </>
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
