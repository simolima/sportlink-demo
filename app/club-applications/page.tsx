'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MegaphoneIcon, InboxIcon, BuildingOfficeIcon, CalendarIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/lib/toast-context'

interface Opportunity {
    id: string | number
    title: string
    type: string
    sport: string
    expiryDate: string
    applicationsCount: number
}

interface Application {
    id: string
    applicantId: string
    status: string
    appliedAt: string
    player?: {
        id: string
        firstName: string
        lastName: string
        avatarUrl?: string
        professionalRole: string
    }
    agent?: {
        id: string
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

export default function ClubApplicationsPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [userId, setUserId] = useState<string | null>(null)
    const [clubId, setClubId] = useState<string | null>(null)
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | number | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [appLoading, setAppLoading] = useState(false)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        const club = localStorage.getItem('selectedClubId')
        if (!id || !club) {
            router.push('/home')
            return
        }
        setUserId(id)
        setClubId(club)
        fetchOpportunities(club)
    }, [router])

    const fetchOpportunities = async (club: string) => {
        try {
            const res = await fetch(`/api/opportunities?clubId=${club}&activeOnly=false`)
            if (res.ok) {
                const data = await res.json()
                setOpportunities(data)
                if (data.length > 0) {
                    setSelectedOpportunityId(data[0].id)
                    fetchApplications(data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error)
            showToast('error', 'Errore', 'Impossibile caricare gli annunci')
        } finally {
            setLoading(false)
        }
    }

    const fetchApplications = async (opportunityId: string | number) => {
        setAppLoading(true)
        try {
            const res = await fetch(`/api/applications?opportunityId=${opportunityId}`)
            if (res.ok) {
                const data = await res.json()
                setApplications(data)
            }
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setAppLoading(false)
        }
    }

    const handleOpportunitySelect = (id: string | number) => {
        setSelectedOpportunityId(id)
        fetchApplications(id)
    }

    const selectedOpportunity = opportunities.find(o => o.id.toString() === selectedOpportunityId?.toString())

    const stats = {
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        total: applications.length,
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">In Revisione</span>
            case 'accepted':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Accettata</span>
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rifiutata</span>
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{status}</span>
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestione Candidature</h1>
                    <p className="text-gray-600 mt-1">Monitora le candidature ricevute per gli annunci della tua società</p>
                </div>

                {/* Layout a 2 colonne */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Annunci */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                                <div className="flex items-center gap-2">
                                    <MegaphoneIcon className="w-5 h-5 text-orange-600" />
                                    <h2 className="font-bold text-gray-900">Annunci ({opportunities.length})</h2>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {opportunities.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <MegaphoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">Nessun annuncio creato</p>
                                    </div>
                                ) : (
                                    opportunities.map((opp) => (
                                        <button
                                            key={opp.id}
                                            onClick={() => handleOpportunitySelect(opp.id)}
                                            className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition border-l-4 ${selectedOpportunityId?.toString() === opp.id.toString()
                                                ? 'border-l-orange-600 bg-orange-50'
                                                : 'border-l-transparent'
                                                }`}
                                        >
                                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{opp.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{opp.sport}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                    {opp.applicationsCount} candidature
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Scade: {new Date(opp.expiryDate).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Candidature per annuncio selezionato */}
                    <div className="lg:col-span-2">
                        {!selectedOpportunity ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">Seleziona un annuncio per vedere le candidature</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header annuncio selezionato */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedOpportunity.title}</h2>
                                    <p className="text-gray-600 mb-4">{selectedOpportunity.type} • {selectedOpportunity.sport}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4" />
                                            Scade: {new Date(selectedOpportunity.expiryDate).toLocaleDateString('it-IT')}
                                        </span>
                                        <span className="font-semibold text-orange-600">{stats.total} candidature ricevute</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-600">In Revisione</p>
                                                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                                            </div>
                                            <ClockIcon className="w-8 h-8 text-amber-400" />
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-600">Accettate</p>
                                                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                                            </div>
                                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-600">Rifiutate</p>
                                                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                                            </div>
                                            <XCircleIcon className="w-8 h-8 text-red-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Applications List */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                                        <div className="flex items-center gap-2">
                                            <InboxIcon className="w-5 h-5 text-green-600" />
                                            <h3 className="font-bold text-gray-900">Candidature ({appLoading ? '...' : stats.total})</h3>
                                        </div>
                                    </div>

                                    {appLoading ? (
                                        <div className="px-6 py-8 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                        </div>
                                    ) : applications.length === 0 ? (
                                        <div className="px-6 py-8 text-center">
                                            <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Nessuna candidatura ricevuta</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {applications.map((app) => (
                                                <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {app.player?.avatarUrl ? (
                                                                    <img
                                                                        src={app.player.avatarUrl}
                                                                        alt={`${app.player.firstName} ${app.player.lastName}`}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                                                                        {app.player?.firstName?.charAt(0) || '?'}{app.player?.lastName?.charAt(0) || ''}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 text-sm">
                                                                        {app.player?.firstName || ''} {app.player?.lastName || ''}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500">
                                                                        {app.player?.professionalRole}
                                                                        {app.agent && (
                                                                            <span className="ml-1 font-medium text-amber-600">
                                                                                (candidato da {app.agent.firstName} {app.agent.lastName})
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Candidato il {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            {getStatusBadge(app.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
