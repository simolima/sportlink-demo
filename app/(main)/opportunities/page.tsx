'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, MapPin, Calendar, Building2, Search, Plus, Users, Eye, Trash2, Target } from 'lucide-react'
import { Opportunity, OPPORTUNITY_TYPES, LEVELS, SUPPORTED_SPORTS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'
import { useRequireAuth } from '@/lib/hooks/useAuth'

interface OpportunityWithDetails extends Opportunity {
  club?: { id: number; name: string; logoUrl?: string }
  applicationsCount?: number
}

interface ClubMembership {
  id: number
  clubId: number
  userId: number
  role: string
  club?: {
    id: number
    name: string
    logoUrl?: string
    sports?: string[]
  }
}

type MainTab = 'career' | 'clubs'
type CareerSubTab = 'all' | 'applications'
type PendingAction =
  | {
    type: 'delete_opportunity'
    opportunityId: number
    title: string
    description: string
  }
  | {
    type: 'withdraw_application'
    applicationId: string
    title: string
    description: string
  }

const normalizeMainTab = (tab: string | null): MainTab => {
  if (tab === 'clubs' || tab === 'my-clubs') return 'clubs'
  return 'career'
}

const normalizeRole = (role: string | null | undefined) => String(role || '').toLowerCase()

export default function OpportunitiesPage() {
  const { user, isLoading: authLoading } = useRequireAuth(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  // Main tabs and sub-tabs
  const initialTab = normalizeMainTab(searchParams.get('tab'))
  const [mainTab, setMainTab] = useState<MainTab>(initialTab)
  const [careerSubTab, setCareerSubTab] = useState<CareerSubTab>('all')

  // Data states
  const [announcements, setAnnouncements] = useState<OpportunityWithDetails[]>([])
  const [myClubOpportunities, setMyClubOpportunities] = useState<OpportunityWithDetails[]>([])
  const [userClubs, setUserClubs] = useState<ClubMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [affiliatedPlayers, setAffiliatedPlayers] = useState<any[]>([])
  const [userApplications, setUserApplications] = useState<any[]>([])
  const [agentApplyTarget, setAgentApplyTarget] = useState<OpportunityWithDetails | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [submittingAgentApplication, setSubmittingAgentApplication] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [submittingPendingAction, setSubmittingPendingAction] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    sport: 'all',
    type: 'all',
    level: 'all',
  })

  useEffect(() => {
    setMainTab(normalizeMainTab(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    if (!agentApplyTarget && !pendingAction) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (submittingAgentApplication || submittingPendingAction) return

      if (agentApplyTarget) closeAgentApplicationModal()
      if (pendingAction) closePendingActionModal()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [agentApplyTarget, pendingAction, submittingAgentApplication, submittingPendingAction])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const userId = localStorage.getItem('currentUserId')
    if (!userId) {
      router.push('/login')
      return
    }
    fetchCurrentUser(userId)
    fetchUserClubs(userId)
  }, [router])

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
      if (normalizeRole(user?.professionalRole) === 'agent') {
        const affiliationsRes = await fetch(`/api/affiliations?agentId=${userId}&status=active`)
        const affiliations = await affiliationsRes.json()
        setAffiliatedPlayers(affiliations.map((aff: any) => aff.player).filter(Boolean))
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchUserClubs = async (userId: string) => {
    try {
      // Carica membership dove l'utente ha ruolo Admin o Manager
      const res = await fetch(`/api/club-memberships?userId=${userId}`)
      const memberships: ClubMembership[] = await res.json()
      // Filtra solo i club dove può gestire opportunità (Admin/Manager)
      const manageable = memberships.filter((m) => ['Admin', 'Manager'].includes(m.role))
      setUserClubs(manageable)

      // Carica opportunità per questi club
      if (manageable.length > 0) {
        const clubIds = manageable.map(m => m.clubId)
        const oppsRes = await fetch('/api/opportunities')
        const allOpps = await oppsRes.json()
        const myClubOpps = allOpps.filter((opp: any) =>
          clubIds.includes(parseInt(opp.clubId))
        )
        setMyClubOpportunities(myClubOpps)
      }
    } catch (error) {
      console.error('Error fetching user clubs:', error)
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
  }, [filters.sport, filters.type, filters.level, filters.search, showToast])

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }))
  }

  const handleApply = async (announcementId: number, announcement: OpportunityWithDetails) => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId || !currentUser) return

    const userRole = normalizeRole(currentUser.professionalRole)
    const requiredRole = normalizeRole(announcement.roleRequired)

    if (userRole !== 'agent' && userRole !== requiredRole) {
      showToast(
        'error',
        'Ruolo non compatibile',
        `Questo annuncio è per ${announcement.roleRequired}, ma tu sei ${currentUser.professionalRole}. Non puoi candidarti.`
      )
      return
    }

    if (userRole === 'agent') {
      if (requiredRole !== 'player') {
        showToast(
          'error',
          'Annuncio non compatibile',
          'Come Agent puoi candidare solo i tuoi assistiti per annunci rivolti ai Player.'
        )
        return
      }

      openAgentApplicationModal(announcement)
      return
    }

    const applicantId = userId
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

  const openAgentApplicationModal = (announcement: OpportunityWithDetails) => {
    if (affiliatedPlayers.length === 0) {
      showToast('info', 'Nessun assistito', 'Non hai ancora giocatori affiliati da candidare.')
      return
    }

    setAgentApplyTarget(announcement)
    setSelectedPlayerId('')
  }

  const closeAgentApplicationModal = () => {
    setAgentApplyTarget(null)
    setSelectedPlayerId('')
    setSubmittingAgentApplication(false)
  }

  const handleAgentApplicationSubmit = async () => {
    if (!agentApplyTarget) return
    const announcementId = typeof agentApplyTarget.id === 'number'
      ? agentApplyTarget.id
      : parseInt(agentApplyTarget.id as string)

    const selectedPlayer = affiliatedPlayers.find((p: any) => String(p.id) === selectedPlayerId)
    if (!selectedPlayer) {
      showToast('error', 'Selezione richiesta', 'Seleziona un assistito prima di continuare')
      return
    }

    setSubmittingAgentApplication(true)
    const checkRes = await fetch(
      `/api/applications?opportunityId=${announcementId}&applicantId=${selectedPlayer.id}`
    )
    const existing = await checkRes.json()

    if (existing.length > 0) {
      showToast('info', 'Già candidato', `${selectedPlayer.firstName} ha già una candidatura per questo annuncio`)
      setSubmittingAgentApplication(false)
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
        closeAgentApplicationModal()
      } else {
        const error = await res.json()
        showToast('error', 'Errore', error.error || 'Impossibile inviare la candidatura')
        setSubmittingAgentApplication(false)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Si è verificato un errore')
      setSubmittingAgentApplication(false)
    }
  }

  const openDeleteOpportunityConfirm = (opportunityId: number, title: string) => {
    setPendingAction({
      type: 'delete_opportunity',
      opportunityId,
      title: 'Eliminare opportunità?',
      description: `Stai per eliminare “${title}”. L'azione non è reversibile.`,
    })
  }

  const openWithdrawApplicationConfirm = (applicationId: string, opportunityTitle: string) => {
    setPendingAction({
      type: 'withdraw_application',
      applicationId,
      title: 'Ritirare candidatura?',
      description: `Ritirerai la candidatura per “${opportunityTitle}”. Potrai candidarti di nuovo in seguito.`,
    })
  }

  const closePendingActionModal = () => {
    setPendingAction(null)
    setSubmittingPendingAction(false)
  }

  const handlePendingActionConfirm = async () => {
    if (!pendingAction) return

    setSubmittingPendingAction(true)
    try {
      if (pendingAction.type === 'delete_opportunity') {
        const res = await fetch(`/api/opportunities?id=${pendingAction.opportunityId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('delete_failed')

        setMyClubOpportunities(prev => prev.filter(o => {
          const id = typeof o.id === 'number' ? o.id : parseInt(String(o.id))
          return id !== pendingAction.opportunityId
        }))
        showToast('success', 'Eliminata', "L'opportunità è stata eliminata")
      }

      if (pendingAction.type === 'withdraw_application') {
        const res = await fetch(`/api/applications?id=${pendingAction.applicationId}&withdraw=true`, { method: 'DELETE' })
        if (!res.ok) throw new Error('withdraw_failed')

        setUserApplications(prev => prev.map(app =>
          String(app.id) === String(pendingAction.applicationId)
            ? { ...app, status: 'withdrawn' }
            : app
        ))
        showToast('success', 'Candidatura ritirata', 'Hai ritirato con successo la candidatura')
      }

      closePendingActionModal()
    } catch {
      showToast('error', 'Errore', 'Operazione non riuscita. Riprova.')
      setSubmittingPendingAction(false)
    }
  }

  // Filtra opportunità per tab "Le mie candidature"
  const getFilteredOpportunities = () => {
    if (careerSubTab === 'applications') {
      const appliedIds = userApplications
        .filter((app: any) => app.status !== 'withdrawn')
        .map((app: any) => (app.opportunityId || app.announcementId)?.toString())
      return announcements.filter(a => appliedIds.includes(a.id.toString()))
    }
    return announcements
  }

  // Raggruppa opportunità dei miei club per club
  const groupedByClub = userClubs.map(membership => ({
    club: membership.club,
    opportunities: myClubOpportunities.filter(
      o => o.clubId?.toString() === membership.clubId.toString()
    )
  }))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">Caricamento opportunità...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen glass-page-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 glass-panel rounded-2xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Opportunità</h1>
          <p className="glass-subtle-text">Trova opportunità per la tua carriera o gestisci quelle dei tuoi club</p>
        </div>

        {/* Main Tabs */}
        <div className="glass-widget rounded-2xl overflow-hidden mb-6">
          <div className="glass-widget-header border-b border-base-300/70">
            <nav className="flex -mb-px">
              <button
                onClick={() => setMainTab('career')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${mainTab === 'career'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-white hover:border-base-300'
                  }`}
              >
                <Briefcase size={18} className="inline mr-2" />
                Per la mia carriera
              </button>
              <button
                onClick={() => setMainTab('clubs')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${mainTab === 'clubs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-white hover:border-base-300'
                  }`}
              >
                <Building2 size={18} className="inline mr-2" />
                Per i miei club
                {userClubs.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {userClubs.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Career Tab Content */}
        {mainTab === 'career' && (
          <>
            {/* Career Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCareerSubTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${careerSubTab === 'all'
                  ? 'bg-primary text-white'
                  : 'glass-widget text-secondary hover:text-white hover:bg-base-300/60'
                  }`}
              >
                Tutte le opportunità
              </button>
              <button
                onClick={() => setCareerSubTab('applications')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${careerSubTab === 'applications'
                  ? 'bg-primary text-white'
                  : 'glass-widget text-secondary hover:text-white hover:bg-base-300/60'
                  }`}
              >
                Le mie candidature
                {userApplications.filter(a => a.status !== 'withdrawn').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {userApplications.filter(a => a.status !== 'withdrawn').length}
                  </span>
                )}
              </button>
            </div>

            {/* Filters (only for "all" sub-tab) */}
            {careerSubTab === 'all' && (
              <div className="glass-widget rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Cerca</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/60" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-base-300 rounded-lg bg-base-300/55 text-secondary placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/25 focus:border-primary"
                        placeholder="Cerca annunci... (premi Enter)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Sport</label>
                    <select
                      value={filters.sport}
                      onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                      className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-300/55 text-secondary focus:ring-2 focus:ring-primary/25 focus:border-primary"
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
                    <label className="block text-sm font-medium text-secondary mb-2">Tipo</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-300/55 text-secondary focus:ring-2 focus:ring-primary/25 focus:border-primary"
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
                    <label className="block text-sm font-medium text-secondary mb-2">Livello</label>
                    <select
                      value={filters.level}
                      onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                      className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-300/55 text-secondary focus:ring-2 focus:ring-primary/25 focus:border-primary"
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
            )}

            {/* Results */}
            {getFilteredOpportunities().length === 0 ? (
              <div className="glass-widget rounded-2xl p-12 text-center">
                <Briefcase size={48} className="mx-auto mb-4 text-secondary/60" />
                <p className="glass-subtle-text">
                  {careerSubTab === 'applications'
                    ? 'Non hai ancora candidature attive'
                    : 'Nessuna opportunità trovata'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredOpportunities().map((announcement) => {
                  const userRole = normalizeRole(currentUser?.professionalRole)
                  const requiredRole = normalizeRole(announcement.roleRequired)
                  const canApply = userRole === 'agent' ? requiredRole === 'player' : userRole === requiredRole
                  const isCompatible = canApply

                  const existingApplication = userApplications.find((app: any) => {
                    const appOpportunityId = app.opportunityId || app.announcementId
                    return appOpportunityId?.toString() === announcement.id.toString() && app.status !== 'withdrawn'
                  })
                  const hasApplied = !!existingApplication

                  const withdrawableApplication = userApplications.find((app: any) => {
                    const appOpportunityId = app.opportunityId || app.announcementId
                    return appOpportunityId?.toString() === announcement.id.toString() && app.status !== 'withdrawn'
                  })

                  return (
                    <div
                      key={announcement.id}
                      className={`glass-widget rounded-2xl border p-6 h-full flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 ${!isCompatible ? 'opacity-70 border-base-300/70' : 'border-base-300/70'
                        }`}
                    >
                      <div className="flex-1 flex flex-col">
                        {!isCompatible && (
                          <div className="mb-3 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg">
                            <p className="text-xs text-warning font-medium">
                              ⚠️ Questo annuncio è per: <strong>{announcement.roleRequired}</strong>
                            </p>
                          </div>
                        )}
                        {userRole === 'agent' && requiredRole === 'player' && (
                          <div className="mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary font-medium">
                              ✓ Puoi candidare i tuoi assistiti
                            </p>
                          </div>
                        )}

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
                              <h3 className="font-semibold text-white">{announcement.club.name}</h3>
                              <p className="text-sm glass-subtle-text">{announcement.sport}</p>
                            </div>
                          </div>
                        )}

                        <h4 className="text-lg font-bold text-white mb-2">{announcement.title}</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-block px-3 py-1 bg-secondary/10 text-primary text-xs font-medium rounded-full">
                            {announcement.type}
                          </span>
                          {announcement.roleRequired && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              <Target className="w-3.5 h-3.5 shrink-0" />
                              {announcement.roleRequired}
                            </span>
                          )}
                        </div>

                        <p className="text-sm glass-subtle-text mb-4 line-clamp-3">
                          {announcement.description}
                        </p>

                        <div className="space-y-2 mb-4 text-sm glass-subtle-text">
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

                        {announcement.applicationsCount !== undefined && (
                          <p className="text-xs glass-quiet-text mb-4">
                            {announcement.applicationsCount} candidatur{announcement.applicationsCount === 1 ? 'a' : 'e'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 mt-4">
                        <button
                          onClick={() =>
                            handleApply(
                              typeof announcement.id === 'number' ? announcement.id : parseInt(announcement.id as string),
                              announcement
                            )
                          }
                          disabled={!isCompatible || hasApplied}
                          className={`w-full px-4 py-2 rounded-lg font-medium transition ${hasApplied
                            ? 'bg-base-300 text-secondary/70 cursor-not-allowed'
                            : isCompatible
                              ? 'bg-primary text-white hover:bg-primary-hover'
                              : 'bg-base-300 text-secondary/50 cursor-not-allowed'
                            }`}
                        >
                          {hasApplied
                            ? '✓ Candidatura già inviata'
                            : normalizeRole(currentUser?.professionalRole) === 'agent'
                              ? 'Candida Assistito'
                              : 'Candidati'}
                        </button>
                        {hasApplied && withdrawableApplication?.status !== 'withdrawn' && (
                          <button
                            onClick={() => openWithdrawApplicationConfirm(String(withdrawableApplication.id), announcement.title)}
                            className="w-full px-4 py-2 rounded-lg font-medium border border-error/40 text-error hover:bg-error/10 transition"
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
          </>
        )}

        {/* Clubs Tab Content */}
        {mainTab === 'clubs' && (
          <>
            {userClubs.length === 0 ? (
              <div className="glass-widget rounded-2xl p-12 text-center">
                <Building2 size={48} className="mx-auto mb-4 text-secondary/60" />
                <h3 className="text-lg font-semibold text-white mb-2">Nessun club gestito</h3>
                <p className="glass-subtle-text mb-6">
                  Non sei Admin o Manager di nessun club. Quando avrai un ruolo di gestione in un club, potrai creare e gestire le opportunità qui.
                </p>
                <Link
                  href="/clubs"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
                >
                  <Search size={18} />
                  Esplora club
                </Link>
              </div>
            ) : (
              <>
                {/* Create button */}
                <div className="mb-6">
                  <Link
                    href="/opportunities/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
                  >
                    <Plus size={18} />
                    Crea opportunità per un club
                  </Link>
                </div>

                {/* Grouped by club */}
                <div className="space-y-8">
                  {groupedByClub.map(({ club, opportunities }) => (
                    <div key={club?.id} className="glass-widget rounded-2xl overflow-hidden">
                      {/* Club header */}
                      <div className="glass-widget-header border-b border-base-300/70 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {club?.logoUrl ? (
                              <img
                                src={club.logoUrl}
                                alt={club.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 size={20} className="text-primary" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-white">{club?.name}</h3>
                              <p className="text-sm glass-subtle-text">
                                {opportunities.length} opportunità attiv{opportunities.length === 1 ? 'a' : 'e'}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/opportunities/new?clubId=${club?.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
                          >
                            <Plus size={16} />
                            Nuova opportunità
                          </Link>
                        </div>
                      </div>

                      {/* Opportunities list */}
                      {opportunities.length === 0 ? (
                        <div className="px-6 py-8 text-center glass-subtle-text">
                          <p>Nessuna opportunità attiva per questo club</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-base-300/60">
                          {opportunities.map((opp) => (
                            <div key={opp.id} className="px-6 py-4 hover:bg-base-300/40 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-white">{opp.title}</h4>
                                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                      {opp.type}
                                    </span>
                                    {opp.roleRequired && (
                                      <span className="px-2 py-0.5 text-xs bg-base-300/70 text-secondary rounded-full">
                                        {opp.roleRequired}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm glass-subtle-text">
                                    {opp.city && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {opp.city}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      Scade: {new Date(opp.expiryDate).toLocaleDateString('it-IT')}
                                    </span>
                                    {opp.applicationsCount !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {opp.applicationsCount} candidatur{opp.applicationsCount === 1 ? 'a' : 'e'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Link
                                    href={`/club-applications?clubId=${club?.id}&opportunityId=${opp.id}`}
                                    className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition"
                                    title="Visualizza candidature"
                                  >
                                    <Eye size={18} />
                                  </Link>
                                  <button
                                    onClick={() => openDeleteOpportunityConfirm(
                                      typeof opp.id === 'number' ? opp.id : parseInt(opp.id as string),
                                      opp.title
                                    )}
                                    className="p-2 text-secondary hover:text-error hover:bg-error/10 rounded-lg transition"
                                    title="Elimina opportunità"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {agentApplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-lg glass-widget rounded-2xl border border-base-300/70 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-application-title"
          >
            <div className="glass-widget-header px-6 py-4 border-b border-base-300/70">
              <h3 id="agent-application-title" className="text-lg font-semibold text-white">Candida un assistito</h3>
              <p className="text-sm glass-subtle-text mt-1 line-clamp-2">
                Seleziona il giocatore da candidare per “{agentApplyTarget.title}”
              </p>
            </div>

            <div className="px-6 py-5 space-y-3 max-h-[52vh] overflow-y-auto">
              {affiliatedPlayers.map((player: any) => {
                const isSelected = selectedPlayerId === String(player.id)
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(String(player.id))}
                    className={`w-full text-left p-4 rounded-xl border transition ${isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300/70 hover:border-primary/40 hover:bg-base-300/50'
                      }`}
                  >
                    <p className="font-medium text-white">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-sm glass-subtle-text mt-1">
                      {player.sport || 'Sport non specificato'}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-base-300/70 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAgentApplicationModal}
                disabled={submittingAgentApplication}
                className="px-4 py-2 rounded-lg border border-base-300 text-secondary hover:text-white hover:bg-base-300/60 disabled:opacity-60"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleAgentApplicationSubmit}
                disabled={!selectedPlayerId || submittingAgentApplication}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingAgentApplication ? 'Invio...' : 'Invia candidatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-md glass-widget rounded-2xl border border-base-300/70 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-action-title"
          >
            <div className="glass-widget-header border-b border-base-300/70 px-5 py-4">
              <h3 id="pending-action-title" className="text-lg font-semibold text-white">{pendingAction.title}</h3>
              <p className="text-sm glass-subtle-text mt-1">{pendingAction.description}</p>
            </div>

            <div className="px-5 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePendingActionModal}
                disabled={submittingPendingAction}
                className="px-4 py-2 rounded-lg border border-base-300 text-secondary hover:text-white hover:bg-base-300/60 disabled:opacity-60"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handlePendingActionConfirm}
                disabled={submittingPendingAction}
                className="px-4 py-2 rounded-lg bg-error text-white hover:opacity-90 disabled:opacity-60"
              >
                {submittingPendingAction ? 'Conferma...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
