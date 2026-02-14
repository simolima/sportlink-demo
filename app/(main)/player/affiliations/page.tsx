'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Check, X, Ban } from 'lucide-react'
import { Affiliation } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface AffiliationWithDetails extends Affiliation {
  agent?: { id: number; firstName: string; lastName: string; avatarUrl?: string }
}

export default function PlayerAffiliationsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [affiliations, setAffiliations] = useState<AffiliationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')

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

        // Check if user is a player (use role_id from DB, not professionalRole)
        if (user.role_id !== 'player') {
          showToast('error', 'Accesso negato', 'Solo i giocatori possono accedere a questa pagina')
          setLoading(false)
          router.push('/home')
          return
        }

        setCurrentUser(user)
        await fetchAffiliations(user.id)
      } catch (error) {
        showToast('error', 'Errore', 'Impossibile caricare i dati')
      }
    }

    loadData()
  }, [])

  const fetchAffiliations = async (playerId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/affiliations?playerId=${playerId}`)
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

  const handleAccept = async (affiliationId: number) => {
    try {
      const res = await fetch('/api/affiliations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: affiliationId,
          status: 'accepted',
        }),
      })

      if (res.ok) {
        showToast('success', 'Affiliazione accettata!', 'Hai accettato l\'affiliazione con successo')
        fetchAffiliations(currentUser.id)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile accettare l\'affiliazione')
    }
  }

  const handleReject = async (affiliationId: number) => {
    try {
      const res = await fetch('/api/affiliations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: affiliationId,
          status: 'rejected',
        }),
      })

      if (res.ok) {
        showToast('success', 'Affiliazione rifiutata', 'Hai rifiutato l\'affiliazione')
        fetchAffiliations(currentUser.id)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile rifiutare l\'affiliazione')
    }
  }

  const handleBlock = async (affiliationId: number, agentId: number) => {
    if (!confirm('Sei sicuro di voler bloccare questo agente? Non potrà più inviarti richieste.')) {
      return
    }

    try {
      // Delete affiliation and block agent
      const res = await fetch(`/api/affiliations?id=${affiliationId}&block=true&playerId=${currentUser.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('success', 'Agente bloccato', 'L\'agente è stato bloccato con successo')
        fetchAffiliations(currentUser.id)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile bloccare l\'agente')
    }
  }

  const handleRemove = async (affiliationId: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questa affiliazione?')) {
      return
    }

    try {
      const res = await fetch(`/api/affiliations?id=${affiliationId}&playerId=${currentUser.id}`, {
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

  // --- Filtri derivati da affiliations per status/tab ---
  const pendingAffiliations = affiliations.filter((a) => a.status === 'pending')
  const acceptedAffiliations = affiliations.filter((a) => a.status === 'accepted')
  const filteredAffiliations =
    filter === 'all'
      ? affiliations
      : filter === 'pending'
        ? pendingAffiliations
        : acceptedAffiliations

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Caricamento...</div>
      </div>
    )
  }

  // Se l'utente non è Player, non mostrare contenuto (evita flash in attesa redirect)
  if (currentUser && currentUser.role_id !== 'player') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Rappresentanza</h1>
        </div>
        <p className="text-gray-600">Gestisci le richieste e le affiliazioni con gli agenti</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8">
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

      {/* Affiliations List */}
      {filteredAffiliations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Shield size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Nessuna affiliazione da visualizzare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAffiliations.map((affiliation) => (
            <div
              key={affiliation.id}
              className={`rounded-lg shadow-sm p-6 ${affiliation.status === 'pending'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-white'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={affiliation.agent?.avatarUrl || '/default-avatar.png'}
                    alt={`${affiliation.agent?.firstName} ${affiliation.agent?.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {affiliation.agent?.firstName} {affiliation.agent?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Ruolo: Agente</p>
                    {affiliation.notes && (
                      <p className="text-sm text-gray-700 mt-3 p-3 bg-white rounded-lg">
                        {affiliation.notes}
                      </p>
                    )}
                    {affiliation.status === 'pending' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Richiesta ricevuta il: {new Date(affiliation.requestedAt).toLocaleDateString('it-IT')}
                      </p>
                    )}
                    {affiliation.status === 'accepted' && affiliation.affiliatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Affiliato dal: {new Date(affiliation.affiliatedAt).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px] items-end">
                  {affiliation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          if (confirm('Vuoi accettare questa richiesta di affiliazione?')) {
                            handleAccept(typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id))
                          }
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 w-full"
                      >
                        <Check size={18} />
                        Accetta
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Vuoi rifiutare questa richiesta?')) {
                            handleReject(typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id))
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 w-full"
                      >
                        <X size={18} />
                        Rifiuta
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bloccare questo agente significa che non potrà più inviarti richieste. Confermi?')) {
                            handleBlock(
                              typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id),
                              typeof affiliation.agentId === 'number' ? affiliation.agentId : parseInt(affiliation.agentId)
                            )
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 w-full"
                        title="Blocca questo agente: non potrà più inviarti richieste."
                      >
                        <Ban size={18} />
                        Blocca
                      </button>
                    </>
                  )}
                  {affiliation.status === 'accepted' && (
                    <>
                      <button
                        onClick={() => router.push(`/messages/${affiliation.agent?.id}`)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-medium mb-2"
                      >
                        Messaggia
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Vuoi rimuovere questa affiliazione?')) {
                            handleRemove(typeof affiliation.id === 'number' ? affiliation.id : parseInt(affiliation.id))
                          }
                        }}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        Rimuovi affiliazione
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
