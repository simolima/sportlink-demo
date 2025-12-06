'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Check, X, Ban } from 'lucide-react'
import { Affiliation } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface AffiliationWithDetails extends Affiliation {
  player?: { id: number; firstName: string; lastName: string; avatarUrl?: string; sport?: string }
  agent?: { id: number; firstName: string; lastName: string }
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
  }, [filter])

  const fetchAffiliations = async (agentId: number) => {
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
          playerId: parseInt(selectedPlayerId),
          message: requestMessage,
        }),
      })

      if (res.ok) {
        showToast('success', 'Richiesta inviata!', 'La richiesta di affiliazione è stata inviata')
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

  const handleRemoveAffiliation = async (affiliationId: number, blockAgent: boolean = false) => {
    if (!confirm(blockAgent ? 'Sei sicuro di voler rimuovere questa affiliazione e bloccare l\'agente?' : 'Sei sicuro di voler rimuovere questa affiliazione?')) {
      return
    }

    try {
      const res = await fetch(`/api/affiliations?id=${affiliationId}&block=${blockAgent}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('success', 'Affiliazione rimossa', 'L\'affiliazione è stata rimossa')
        fetchAffiliations(currentUser.id)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile rimuovere l\'affiliazione')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Le Mie Affiliazioni</h1>
              <p className="text-gray-600">Gestisci i giocatori affiliati</p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <UserPlus size={20} />
            Richiedi Affiliazione
          </button>
        </div>

        {/* Request Form */}
        {showRequestForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Invia Richiesta di Affiliazione</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Giocatore
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Presenta te stesso e spiega perché vuoi affiliarti a questo giocatore..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSendRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invia Richiesta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'accepted'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' && 'Tutte'}
            {status === 'pending' && 'In attesa'}
            {status === 'accepted' && 'Accettate'}
          </button>
        ))}
      </div>

      {/* Affiliations List */}
      {affiliations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Nessuna affiliazione da visualizzare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {affiliations.map((affiliation) => (
            <div key={affiliation.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={affiliation.player?.avatarUrl || '/default-avatar.png'}
                    alt={`${affiliation.player?.firstName} ${affiliation.player?.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {affiliation.player?.firstName} {affiliation.player?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{affiliation.player?.sport || 'Sport non specificato'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Richiesta il: {new Date(affiliation.requestedAt).toLocaleDateString('it-IT')}
                    </p>
                    {affiliation.status === 'accepted' && affiliation.affiliatedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Affiliato dal: {new Date(affiliation.affiliatedAt).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      affiliation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : affiliation.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {affiliation.status === 'pending' && 'In attesa'}
                    {affiliation.status === 'accepted' && 'Accettata'}
                    {affiliation.status === 'rejected' && 'Rifiutata'}
                  </span>

                  {/* Actions */}
                  {affiliation.status === 'accepted' && (
                    <button
                      onClick={() =>
                        handleRemoveAffiliation(
                          typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id),
                          false
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rimuovi affiliazione"
                    >
                      <X size={20} />
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
