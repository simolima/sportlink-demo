'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ApplicationsSummary {
    pending: number
    accepted: number
    rejected: number
    total: number
}

export interface YourApplicationsWidgetProps {
    userId: string
}

export default function YourApplicationsWidget({ userId }: YourApplicationsWidgetProps) {
    const [summary, setSummary] = useState<ApplicationsSummary>({ pending: 0, accepted: 0, rejected: 0, total: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/applications')
                if (res.ok) {
                    const applications = await res.json()
                    const myApps = applications.filter((a: any) => a.applicantId === userId)
                    const pending = myApps.filter((a: any) => a.status === 'pending').length
                    const accepted = myApps.filter((a: any) => a.status === 'accepted').length
                    const rejected = myApps.filter((a: any) => a.status === 'rejected').length
                    setSummary({ pending, accepted, rejected, total: myApps.length })
                }
            } catch (error) {
                console.error('Error fetching applications:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

    const hasApplications = summary.total > 0

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Le Tue Candidature</h3>
                            <p className="text-xs text-gray-500">Stato delle tue candidature</p>
                        </div>
                    </div>
                    <Link
                        href="/opportunities"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Dettagli →
                    </Link>
                </div>
            </div>

            {/* Content */}
            {!hasApplications ? (
                <div className="px-6 py-8 text-center">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nessuna candidatura inviata</p>
                    <Link
                        href="/opportunities"
                        className="inline-block mt-3 text-sm font-medium text-green-600 hover:text-green-700"
                    >
                        Esplora opportunità →
                    </Link>
                </div>
            ) : (
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {/* In Revisione */}
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <ClockIcon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-amber-700">{summary.pending}</div>
                            <div className="text-xs text-amber-600">In Revisione</div>
                        </div>

                        {/* Accettate */}
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-700">{summary.accepted}</div>
                            <div className="text-xs text-green-600">Accettate</div>
                        </div>

                        {/* Rifiutate */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <XCircleIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-500">{summary.rejected}</div>
                            <div className="text-xs text-gray-500">Rifiutate</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
