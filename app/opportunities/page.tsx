'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Calendar, Building2, Search, Plus } from 'lucide-react'
import { Announcement, SPORTS, ANNOUNCEMENT_TYPES, LEVELS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'
import { useRequireAuth } from '@/lib/hooks/useAuth'

interface AnnouncementWithDetails extends Announcement {
  club?: { id: number; name: string; logoUrl?: string }
  applicationsCount?: number
}

export default function JobsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(true)
  const router = useRouter()
  const { showToast } = useToast()
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([])
  const [loading, setLoading] = useState(true)
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
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.sport !== 'all') params.append('sport', filters.sport)
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.level !== 'all') params.append('level', filters.level)
      params.append('activeOnly', 'true')

      const res = await fetch(`/api/announcements?${params}`)
      const data = await res.json()
      setAnnouncements(data)
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile caricare gli annunci')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [filters])

  const handleApply = async (announcementId: number) => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) return

    const playerId = parseInt(userId)

    // Check if already applied
    const checkRes = await fetch(`/api/applications?announcementId=${announcementId}&playerId=${playerId}`)
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
          announcementId,
          playerId,
          message: '',
        }),
      })

      if (res.ok) {
        showToast('success', 'Candidatura inviata!', 'La tua candidatura è stata inviata con successo')
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
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cerca annunci..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti gli sport</option>
                {SPORTS.map((sport) => (
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                {ANNOUNCEMENT_TYPES.map((type) => (
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
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
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 size={24} className="text-blue-600" />
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
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                  {announcement.type}
                </span>

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
                <button
                  onClick={() => handleApply(typeof announcement.id === 'number' ? announcement.id : parseInt(announcement.id))}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Candidati
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
