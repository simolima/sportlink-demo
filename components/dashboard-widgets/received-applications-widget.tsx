'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { InboxIcon, ClockIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'

interface RecentApplication {
    id: number | string
    applicantName: string
    announcementTitle: string
    appliedAt: string
    status: string
}

export interface ReceivedApplicationsWidgetProps {
    userId: string
    clubId?: string | number
}

export default function ReceivedApplicationsWidget({ userId, clubId }: ReceivedApplicationsWidgetProps) {
    const [totalNew, setTotalNew] = useState(0)
    const [totalPending, setTotalPending] = useState(0)
    const [totalReviewed, setTotalReviewed] = useState(0)
    const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
    const [loading, setLoading] = useState(true)

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

                // Get recent with user names
                const usersRes = await fetch('/api/users')
                if (usersRes.ok) {
                    const users = await usersRes.json()
                    const recent = applications.slice(0, 5).map((app: any) => {
                        const user = users.find((u: any) => String(u.id) === String(app.applicantId))
                        const agent = app.agent ? users.find((u: any) => String(u.id) === String(app.agent.id)) : null
                        const oppTitle = app.opportunity?.title || 'Opportunità'
                        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utente' : 'Utente'
                        // Se candidatura via agente, mostra "Candidato da Agente"
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
                console.error('Error fetching applications:', error)
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 border-b border-gray-100 ${totalNew > 0 ? 'bg-gradient-to-r from-red-50 to-white' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalNew > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <InboxIcon className={`w-5 h-5 ${totalNew > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Candidature Ricevute</h3>
                            <p className="text-xs text-gray-500">Per i tuoi annunci</p>
                        </div>
                    </div>
                    {totalNew > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                            {totalNew} nuove
                        </span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="p-6">
                {total === 0 ? (
                    <div className="text-center py-4">
                        <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Nessuna candidatura ricevuta</p>
                        <p className="text-gray-400 text-xs mt-1">Le candidature appariranno qui quando arriveranno</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {/* Nuove */}
                            <div className={`text-center p-3 rounded-lg ${totalNew > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <div className={`text-2xl font-bold ${totalNew > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {totalNew}
                                </div>
                                <div className={`text-xs ${totalNew > 0 ? 'text-red-500' : 'text-gray-500'}`}>Nuove</div>
                            </div>

                            {/* In Revisione */}
                            <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <div className="text-2xl font-bold text-amber-600">{totalPending}</div>
                                <div className="text-xs text-amber-500">In Revisione</div>
                            </div>

                            {/* Gestite */}
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{totalReviewed}</div>
                                <div className="text-xs text-green-500">Gestite</div>
                            </div>
                        </div>

                        {/* Recent Applications - Horizontal Scroll */}
                        {recentApplications.length > 0 && (
                            <div className="border-t border-gray-100 pt-4 mt-4">
                                <div className="text-xs text-gray-500 mb-3">Ultime candidature</div>
                                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                                    {recentApplications.slice(0, 5).map((app) => (
                                        <div
                                            key={app.id}
                                            className="min-w-[200px] flex-1 snap-start p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                        >
                                            <div className="text-xs font-semibold text-gray-700 truncate mb-1">
                                                {app.applicantName}
                                            </div>
                                            <div className="text-xs text-gray-500 leading-snug line-clamp-2 mb-2">
                                                {app.announcementTitle}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[11px] text-gray-400">
                                                    {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-white border border-gray-200 text-gray-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <Link
                            href="/club-applications"
                            className="block w-full text-center mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                        >
                            <EyeIcon className="w-4 h-4 inline mr-2" />
                            Gestisci Candidature
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
