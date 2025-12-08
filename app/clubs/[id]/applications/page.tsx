'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Check, X, Eye } from 'lucide-react'
import { Application, Opportunity, Club } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface ApplicationWithDetails extends Application {
  opportunity: Opportunity | null
  player: { id: number; firstName: string; lastName: string; avatarUrl?: string } | null
  agent: { id: number; firstName: string; lastName: string } | null
}

export default function ClubApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const clubId = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) {
      router.push('/login')
      return
    }
    fetchData(parseInt(userId))
  }, [clubId, filter])

  const fetchData = async (userId: number) => {
    setLoading(true)
    try {
      // Check permissions
      const membersRes = await fetch(`/api/club-memberships?clubId=${clubId}&userId=${userId}`)
      const membershipData = await membersRes.json()

      if (membershipData.length === 0) {
        showToast('error', 'Accesso negato', 'Non sei membro di questo club')
        router.push(`/clubs/${clubId}`)
        return
      }

      const membership = membershipData[0]
      const canManage = membership.role === 'Admin' || membership.permissions.includes('manage_applications')

      if (!canManage) {
        showToast('error', 'Accesso negato', 'Non hai i permessi per gestire le candidature')
        router.push(`/clubs/${clubId}`)
        return
      }

      setHasPermission(true)

      // Fetch club
      const clubRes = await fetch(`/api/clubs`)
      const clubs = await clubRes.json()
      const foundClub = clubs.find((c: any) => c.id.toString() === clubId)
      setClub(foundClub)

      // Fetch applications
      const statusParam = filter !== 'all' ? `&status=${filter}` : ''
      const appsRes = await fetch(`/api/applications?clubId=${clubId}${statusParam}`)
      const appsData = await appsRes.json()
      setApplications(appsData)
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile caricare i dati')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (appId: number, status: 'accepted' | 'rejected') => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) return

    try {
      const res = await fetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status, reviewedBy: parseInt(userId) }),
      })

      if (res.ok) {
        showToast(
          'success',
          status === 'accepted' ? 'Candidatura accettata' : 'Candidatura rifiutata',
          'Lo stato della candidatura è stato aggiornato'
        )
        fetchData(parseInt(userId))
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile aggiornare la candidatura')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Caricamento...</div>
      </div>
    )
  }

  if (!hasPermission) return null

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna al club
        </button>
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} />
          <h1 className="text-3xl font-bold">Gestione Candidature</h1>
        </div>
        <p className="text-gray-600">{club?.name}</p>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {status === 'all' && 'Tutte'}
            {status === 'pending' && 'In attesa'}
            {status === 'accepted' && 'Accettate'}
            {status === 'rejected' && 'Rifiutate'}
          </button>
        ))}
      </div>

      {/* Lista candidature */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow border p-12 text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessuna candidatura da visualizzare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={app.player?.avatarUrl || '/default-avatar.png'}
                    alt={`${app.player?.firstName} ${app.player?.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {app.player?.firstName} {app.player?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Candidatura per: <span className="font-medium">{app.announcement?.title}</span>
                    </p>
                    {app.agent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Tramite agente: {app.agent.firstName} {app.agent.lastName}
                      </p>
                    )}
                    {app.message && (
                      <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">
                        {app.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Candidato il: {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Badge stato */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-center ${app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : app.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {app.status === 'pending' && 'In attesa'}
                    {app.status === 'accepted' && 'Accettata'}
                    {app.status === 'rejected' && 'Rifiutata'}
                  </span>

                  {/* Azioni */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateApplicationStatus(
                            typeof app.id === 'number' ? app.id : parseInt(app.id),
                            'accepted'
                          )
                        }
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Accetta"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() =>
                          updateApplicationStatus(
                            typeof app.id === 'number' ? app.id : parseInt(app.id),
                            'rejected'
                          )
                        }
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Rifiuta"
                      >
                        <X size={20} />
                      </button>
                    </div>
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
