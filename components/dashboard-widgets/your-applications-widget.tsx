'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardDocumentListIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export interface YourApplicationsWidgetProps {
    userId: string
}

export default function YourApplicationsWidget({ userId }: YourApplicationsWidgetProps) {
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/applications?applicantId=${userId}`)
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
        fetchData()
    }, [userId])
    const hasApplications = applications.length > 0

    return (
        <div className="glass-widget rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="glass-widget-header px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/25 rounded-lg flex items-center justify-center">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Le Tue Candidature</h3>
                            <p className="text-xs glass-subtle-text">Stato delle tue candidature</p>
                        </div>
                    </div>
                    <Link
                        href="/my-applications"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
                    >
                        Dettagli
                        <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Content */}
            {!hasApplications ? (
                <div className="px-6 py-8 text-center">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-secondary/45 mx-auto mb-3" />
                    <p className="glass-subtle-text text-sm">Nessuna candidatura inviata</p>
                    <Link
                        href="/opportunities"
                        className="inline-block mt-3 text-sm font-medium text-primary hover:text-primary/80"
                    >
                        Esplora opportunità →
                    </Link>
                </div>
            ) : (
                <div className="p-6">
                    <div className="text-xs glass-subtle-text mb-3">Ultime candidature inviate</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                        {applications.slice(0, 5).map((app: any) => (
                            <div
                                key={app.id}
                                className="min-w-[200px] flex-1 snap-start p-3 bg-base-300/65 rounded-xl border border-base-300"
                            >
                                <div className="text-xs font-semibold text-white truncate mb-1">
                                    {app.opportunity?.title || 'Opportunità'}
                                </div>
                                <div className="text-xs glass-subtle-text leading-snug line-clamp-2 mb-2">
                                    {app.message || 'Nessun messaggio'}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] glass-quiet-text">
                                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('it-IT') : '-'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-base-200/65 border border-base-300 text-secondary">
                                        <span className="h-1.5 w-1.5 rounded-full bg-success inline-block"></span>
                                        {app.status || 'pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
