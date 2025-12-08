'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { InboxIcon, ClockIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import StatBox from '../stat-box'

interface RecentApplication {
    id: number | string
    applicantName: string
    announcementTitle: string
    appliedAt: string
    status: string
}

export interface ClubDashboardWidgetProps {
    userId: string
    clubId?: string | number
}

export default function ClubDashboardWidget({ userId, clubId }: ClubDashboardWidgetProps) {
    const [totalNew, setTotalNew] = useState(0)
    const [totalPending, setTotalPending] = useState(0)
    const [totalReviewed, setTotalReviewed] = useState(0)
    const [totalAnnouncements, setTotalAnnouncements] = useState(0)
    const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
    const [loading, setLoading] = useState(true)
    const MAX_APPLICATIONS = 15

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!clubId) return

                // Get applications for this club via API
                const appRes = await fetch(`/api/applications?clubId=${clubId}`)
                if (!appRes.ok) return
                const applications = await appRes.json()

                setTotalNew(applications.filter((a: any) => a.status === 'new').length)
                setTotalPending(applications.filter((a: any) => a.status === 'pending').length)
                setTotalReviewed(applications.filter((a: any) =>
                    a.status === 'accepted' || a.status === 'rejected'
                ).length)

                // Get announcements
                const annRes = await fetch(`/api/opportunities?clubId=${clubId}&activeOnly=true`)
                if (annRes.ok) {
                    const announcements = await annRes.json()
                    setTotalAnnouncements(announcements.length)
                }

                // Get recent applications with user names
                const usersRes = await fetch('/api/users')
                if (usersRes.ok) {
                    const users = await usersRes.json()
                    const recent = applications.slice(0, MAX_APPLICATIONS).map((app: any) => {
                        const user = users.find((u: any) => String(u.id) === String(app.applicantId))
                        const agent = app.agent ? users.find((u: any) => String(u.id) === String(app.agent.id)) : null
                        const oppTitle = app.opportunity?.title || 'Opportunità'
                        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utente' : 'Utente'
                        const displayName = app.agent ? `${fullName} (da ${app.agent.firstName} ${app.agent.lastName})` : fullName
                        return {
                            id: app.id,
                            applicantName: displayName,
                            announcementTitle: oppTitle,
                            appliedAt: app.appliedAt || app.createdAt,
                            status: app.status
                        }
                    })
                    setRecentApplications(recent)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId, clubId])

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    const total = totalNew + totalPending + totalReviewed

    if (!clubId) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-8 text-center text-gray-500">Seleziona una società per vedere le candidature.</div>
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new':
                return 'bg-blue-50 border-l-4 border-blue-500'
            case 'pending':
                return 'bg-yellow-50 border-l-4 border-yellow-500'
            case 'accepted':
                return 'bg-success/10 border-l-4 border-success'
            case 'rejected':
                return 'bg-red-50 border-l-4 border-red-500'
            default:
                return 'bg-gray-50 border-l-4 border-gray-300'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new':
                return 'Nuova'
            case 'pending':
                return 'In sospeso'
            case 'accepted':
                return 'Accettata'
            case 'rejected':
                return 'Rifiutata'
            default:
                return status
        }
    }

    return (
        <div className="space-y-6">
            {/* Statistiche e titolo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <InboxIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Candidature Ricevute</h3>
                        </div>
                        <Link
                            href={clubId ? `/clubs/${clubId}` : '/clubs'}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Tutte
                        </Link>
                    </div>

                    {/* Statistiche in barra orizzontale */}
                    <div className="flex flex-wrap gap-3">
                        <StatBox label="Annunci attivi" value={totalAnnouncements} />
                        <StatBox label="Candidature nuove" value={totalNew} />
                        <StatBox label="Candidature ricevute" value={totalReviewed} />
                    </div>
                </div>
            </div>

            {/* Candidature scrollabili */}
            {recentApplications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-8 text-center">
                    <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nessuna candidatura ricevuta</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4">
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                            {recentApplications.map((app) => (
                                <Link
                                    href={`/club-applications?focus=${app.id}`}
                                    key={app.id}
                                    className={`min-w-[280px] max-w-[320px] snap-start p-4 rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition ${getStatusColor(app.status)}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900 leading-snug line-clamp-2">{app.applicantName}</h4>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                        {app.announcementTitle}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${app.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                app.status === 'accepted' ? 'bg-success/10 text-success' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {getStatusLabel(app.status)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
