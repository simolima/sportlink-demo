'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Calendar, Building2, Search } from 'lucide-react'
import { Opportunity, OPPORTUNITY_TYPES, LEVELS, SUPPORTED_SPORTS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'
import { useRequireAuth } from '@/lib/hooks/useAuth'

interface OpportunityWithDetails extends Opportunity {
  club?: { id: number; name: string; logoUrl?: string }
  applicationsCount?: number
}

export default function JobsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(false)
  const router = useRouter()
  const { showToast } = useToast()
  const [announcements, setAnnouncements] = useState<OpportunityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [affiliatedPlayers, setAffiliatedPlayers] = useState<any[]>([])
  const [userApplications, setUserApplications] = useState<any[]>([])
  const [searchInput, setSearchInput] = useState('') // Stato separato per l'input
  const [filters, setFilters] = useState({
    search: '',
    sport: 'all',
    type: 'all',
    level: 'all',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const userId = localStorage.getItem('currentUserId')
    if (!userId) {
      router.push('/login')
      return
    }
    fetchCurrentUser(userId)
  }, [])

  const fetchCurrentUser = async (userId: string) => {
    try {
      const res = await fetch('/api/users')
      const users = await res.json()
      const user = users.find((u: any) => u.id.toString() === userId)
      setCurrentUser(user)

      // Carica candidature dell'utente
      const appsRes = await fetch(`/api/applications?applicantId=${userId}`)
      if (appsRes.ok) {
        const apps = await appsRes.json()
        setUserApplications(apps)
      }

      // Se è un Agent, carica i giocatori affiliati
      if (user && user.professionalRole === 'Agent') {
        const affiliationsRes = await fetch(`/api/affiliations?agentId=${userId}&status=accepted`)
        const affiliations = await affiliationsRes.json()
        setAffiliatedPlayers(affiliations.map((aff: any) => aff.player).filter(Boolean))
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.sport !== 'all') params.append('sport', filters.sport)
        if (filters.type !== 'all') params.append('type', filters.type)
        if (filters.level !== 'all') params.append('level', filters.level)
        params.append('activeOnly', 'true')

        const res = await fetch(`/api/opportunities?${params}`)
        const data = await res.json()
        setAnnouncements(data)
      } catch (error) {
        showToast('error', 'Errore', 'Impossibile caricare gli annunci')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [filters.sport, filters.type, filters.level, filters.search]) // Solo questi trigger il fetch

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }))
  }

  const handleApply = async (announcementId: number, announcement: OpportunityWithDetails) => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId || !currentUser) return

    // Validazione ruolo
    const userRole = currentUser.professionalRole
    const requiredRole = announcement.roleRequired

    // Se l'utente NON è un Agent, deve corrispondere il ruolo
    if (userRole !== 'Agent' && userRole !== requiredRole) {
      showToast(
        'error',
        'Ruolo non compatibile',
        `Questo annuncio è per ${requiredRole}, ma tu sei ${userRole}. Non puoi candidarti.`
      )
      return
    }

    // Se è un Agent, può candidare solo i suoi giocatori affiliati per annunci Player
    if (userRole === 'Agent') {
      if (requiredRole !== 'Player') {
        showToast(
          'error',
          'Annuncio non compatibile',
          'Come Agent puoi candidare solo i tuoi assistiti per annunci rivolti ai Player.'
        )
        return
      }

      if (affiliatedPlayers.length === 0) {
        showToast('info', 'Nessun assistito', 'Non hai ancora giocatori affiliati da candidare.')
        return
      }

      // Mostra dialog per selezionare quale giocatore candidare
      handleAgentApplication(announcementId, announcement)
      return
    }

    // Candidatura standard (Player, Director, President)
    const applicantId = userId

    // Check if already applied
    const checkRes = await fetch(`/api/applications?opportunityId=${announcementId}&applicantId=${applicantId}`)
    const existing = await checkRes.json()

    if (existing.length > 0) {
      showToast('info', 'Già candidato', 'Hai già inviato una candidatura per questo annuncio')
      return
    }

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: announcementId,
          applicantId,
          message: '',
        }),
      })

      if (res.ok) {
        showToast('success', 'Candidatura inviata!', 'La tua candidatura è stata inviata con successo')
        // Ricarica candidature
        const userId = localStorage.getItem('currentUserId')
        if (userId) {
          const appsRes = await fetch(`/api/applications?applicantId=${userId}`)
          if (appsRes.ok) {
            const apps = await appsRes.json()
            setUserApplications(apps)
          }
        }
      } else {
        const error = await res.json()
        showToast('error', 'Errore', error.error || 'Impossibile inviare la candidatura')
      }
    } catch (error) {
      showToast('error', 'Errore', 'Si è verificato un errore')
    }
  }

  const handleAgentApplication = async (announcementId: number, announcement: OpportunityWithDetails) => {
    // Mostra selezione giocatore
    const playerNames = affiliatedPlayers.map((p: any) => `${p.firstName} ${p.lastName}`).join('\n')
    const selectedIndex = prompt(
      `Seleziona quale giocatore candidare per "${announcement.title}":\n\n${affiliatedPlayers
        .map((p: any, i: number) => `${i + 1}. ${p.firstName} ${p.lastName} - ${p.sport || 'N/A'}`)
        .join('\n')}\n\nInserisci il numero:`
    )

    if (!selectedIndex) return

    const index = parseInt(selectedIndex) - 1
    if (isNaN(index) || index < 0 || index >= affiliatedPlayers.length) {
      showToast('error', 'Errore', 'Selezione non valida')
      return
    }

    const selectedPlayer = affiliatedPlayers[index]

    // Check if already applied
    const checkRes = await fetch(
      `/api/applications?opportunityId=${announcementId}&applicantId=${selectedPlayer.id}`
    )
    const existing = await checkRes.json()

    if (existing.length > 0) {
      showToast('info', 'Già candidato', `${selectedPlayer.firstName} ha già una candidatura per questo annuncio`)
      return
    }

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: announcementId,
          applicantId: selectedPlayer.id,
          agentId: currentUser.id,
          message: `Candidatura inviata dall'agente ${currentUser.firstName} ${currentUser.lastName}`,
        }),
      })

      if (res.ok) {
        showToast(
          'success',
          'Candidatura inviata!',
          `${selectedPlayer.firstName} ${selectedPlayer.lastName} è stato candidato con successo`
        )
        fetchAnnouncements()
      } else {
        const error = await res.json()
        showToast('error', 'Errore', error.error || 'Impossibile inviare la candidatura')
      }
    } catch (error) {
      showToast('error', 'Errore', 'Si è verificato un errore')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">Caricamento opportunità...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opportunità</h1>
          <p className="text-gray-600">Trova le migliori opportunità professionali nel mondo dello sport</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Cerca annunci... (premi Enter)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tutti gli sport</option>
                {SUPPORTED_SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                {OPPORTUNITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Livello</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tutti i livelli</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nessuna opportunità trovata</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => {
              // Check if user can apply
              const userRole = currentUser?.professionalRole
              const requiredRole = announcement.roleRequired
              const canApply =
                userRole === 'Agent' ? requiredRole === 'Player' : userRole === requiredRole
              const isCompatible = canApply

              // Check if already applied (exclude withdrawn applications - they can re-apply)
              const existingApplication = userApplications.find((app: any) => {
                const appOpportunityId = app.opportunityId || app.announcementId
                return appOpportunityId?.toString() === announcement.id.toString() && app.status !== 'withdrawn'
              })
              const hasApplied = !!existingApplication

              // For withdraw button, need to find any non-withdrawn application
              const withdrawableApplication = userApplications.find((app: any) => {
                const appOpportunityId = app.opportunityId || app.announcementId
                return appOpportunityId?.toString() === announcement.id.toString() && app.status !== 'withdrawn'
              })

              return (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 ${!isCompatible ? 'opacity-60 border-2 border-gray-200' : 'border-2 border-transparent'
                    }`}
                >
                  {/* Compatibility indicator */}
                  {!isCompatible && (
                    <div className="mb-3 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg">
                      <p className="text-xs text-warning font-medium">
                        ⚠️ Questo annuncio è per: <strong>{requiredRole}</strong>
                      </p>
                    </div>
                  )}
                  {userRole === 'Agent' && requiredRole === 'Player' && (
                    <div className="mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-xs text-primary font-medium">
                        ✓ Puoi candidare i tuoi assistiti
                      </p>
                    </div>
                  )}
                  {/* Club info */}
                  {announcement.club && (
                    <div className="flex items-center gap-3 mb-4">
                      {announcement.club.logoUrl ? (
                        <img
                          src={announcement.club.logoUrl}
                          alt={announcement.club.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 size={24} className="text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{announcement.club.name}</h3>
                        <p className="text-sm text-gray-500">{announcement.sport}</p>
                      </div>
                    </div>
                  )}

                  {/* Title and type */}
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-secondary/10 text-primary text-xs font-medium rounded-full">
                      {announcement.type}
                    </span>
                    {announcement.roleRequired && (
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        🎯 {announcement.roleRequired}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {announcement.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {announcement.contractType && (
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} />
                        <span>{announcement.contractType}</span>
                      </div>
                    )}
                    {announcement.level && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Livello:</span>
                        <span>{announcement.level}</span>
                      </div>
                    )}
                    {announcement.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{announcement.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Scade: {new Date(announcement.expiryDate).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>

                  {/* Application count */}
                  {announcement.applicationsCount !== undefined && (
                    <p className="text-xs text-gray-500 mb-4">
                      {announcement.applicationsCount} candidatur{announcement.applicationsCount === 1 ? 'a' : 'e'}
                    </p>
                  )}

                  {/* Apply button */}
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        handleApply(
                          typeof announcement.id === 'number' ? announcement.id : parseInt(announcement.id),
                          announcement
                        )
                      }
                      disabled={!isCompatible || hasApplied}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition ${hasApplied
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        : isCompatible
                          ? 'bg-primary text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {hasApplied
                        ? '✓ Candidatura già inviata'
                        : currentUser?.professionalRole === 'Agent'
                          ? 'Candida Assistito'
                          : 'Candidati'}
                    </button>
                    {hasApplied && withdrawableApplication?.status !== 'withdrawn' && (
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`/api/applications?id=${withdrawableApplication.id}&withdraw=true`, { method: 'DELETE' })
                            setUserApplications(prev => prev.map(app => app.id === withdrawableApplication.id ? { ...app, status: 'withdrawn' } : app))
                          } catch (e) {
                            alert('Errore nel ritiro della candidatura')
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg font-medium border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Ritira candidatura
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
