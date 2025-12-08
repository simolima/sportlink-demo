'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, XCircleIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Application {
    id: string
    opportunityId: string
    applicantId: string
    status: string
    message: string
    appliedAt: string
    opportunity?: {
        id: string
        title: string
        type: string
        sport: string
        club?: {
            id: string
            name: string
            logoUrl?: string
        }
    }
}

export default function MyApplicationsPage() {
    const router = useRouter()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'withdrawn'>('all')

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }
        setUserId(id)
        fetchApplications(id)
    }, [router])

    const fetchApplications = async (id: string) => {
        try {
            const res = await fetch(`/api/applications?applicantId=${id}`)
            if (res.ok) {
                const data = await res.json()
                setApplications(data)
            }
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredApplications = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter)

    const stats = {
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        withdrawn: applications.filter(a => a.status === 'withdrawn').length,
        total: applications.length,
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">In Revisione</span>
            case 'accepted':
                return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Accettata</span>
            case 'rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rifiutata</span>
            case 'withdrawn':
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Ritirata</span>
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{status}</span>
        }
    }

    const handleWithdraw = async (id: string) => {
        try {
            setWithdrawingId(id)
            const res = await fetch(`/api/applications?id=${id}&withdraw=true`, { method: 'DELETE' })
            if (res.ok) {
                setApplications(prev => prev.map(a => a.id.toString() === id.toString() ? { ...a, status: 'withdrawn' } : a))
            } else {
                const e = await res.json().catch(() => ({}))
                alert(e.error || 'Errore nel ritiro della candidatura')
            }
        } catch (err) {
            alert('Errore nel ritiro della candidatura')
        } finally {
            setWithdrawingId(null)
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
                    <h1 className="text-3xl font-bold text-gray-900">Le Tue Candidature</h1>
                    <p className="text-gray-600 mt-1">Monitora lo stato delle tue candidature</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Totali</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <ClipboardDocumentListIcon className="w-10 h-10 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Revisione</p>
                                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                            </div>
                            <ClockIcon className="w-10 h-10 text-amber-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Accettate</p>
                                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                            </div>
                            <CheckCircleIcon className="w-10 h-10 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Rifiutate</p>
                                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                            </div>
                            <XCircleIcon className="w-10 h-10 text-red-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ritirate</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.withdrawn}</p>
                            </div>
                            <ClipboardDocumentListIcon className="w-10 h-10 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tutte ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            In Revisione ({stats.pending})
                        </button>
                        <button
                            onClick={() => setFilter('accepted')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'accepted'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Accettate ({stats.accepted})
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'rejected'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Rifiutate ({stats.rejected})
                        </button>
                        <button
                            onClick={() => setFilter('withdrawn')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'withdrawn'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Ritirate ({stats.withdrawn})
                        </button>
                    </div>
                </div>

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nessuna candidatura
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filter === 'all'
                                ? 'Non hai ancora inviato candidature.'
                                : `Non hai candidature con stato "${filter}".`}
                        </p>
                        <Link
                            href="/opportunities"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            Esplora Opportunità
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map((app) => (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {app.opportunity?.club?.logoUrl ? (
                                                <img
                                                    src={app.opportunity.club.logoUrl}
                                                    alt={app.opportunity.club.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {app.opportunity?.title || 'Opportunità'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {app.opportunity?.club?.name || 'Club non disponibile'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                            {app.opportunity?.type && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {app.opportunity.type}
                                                </span>
                                            )}
                                            {app.opportunity?.sport && (
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                    {app.opportunity.sport}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                Candidato il {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                                            </span>
                                        </div>

                                        {app.message && (
                                            <p className="mt-3 text-sm text-gray-600 italic">"{app.message}"</p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(app.status)}
                                            {app.status !== 'withdrawn' && (
                                                <button
                                                    onClick={() => handleWithdraw(app.id)}
                                                    disabled={withdrawingId === app.id.toString()}
                                                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    {withdrawingId === app.id.toString() ? 'Ritiro...' : 'Ritira candidatura'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
