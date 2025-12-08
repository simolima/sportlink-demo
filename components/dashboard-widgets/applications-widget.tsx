"use client"
import React from 'react'
import Link from 'next/link'
import { Application, ApplicationStatus } from '@/lib/types'

interface ApplicationsWidgetProps {
    applications: any[] // Application con dettagli
    title?: string
    subtitle?: string
    maxItems?: number
    emptyMessage?: string
}

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Sospeso' },
    in_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Revisione' },
    accepted: { bg: 'bg-success/10', text: 'text-success', label: 'Accettata' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutata' },
    withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Ritirata' }
}

export default function ApplicationsWidget({
    applications,
    title = 'Le mie Candidature',
    subtitle = 'Stato delle tue candidature',
    maxItems = 5,
    emptyMessage = 'Non hai candidature al momento'
}: ApplicationsWidgetProps) {
    const displayedItems = applications.slice(0, maxItems)

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">📋</div>
                    <p className="text-gray-600">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedItems.map((app) => {
                        const statusInfo = STATUS_COLORS[app.status as ApplicationStatus]
                        return (
                            <div
                                key={app.id}
                                className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {app.announcement?.title || 'Opportunità'}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {app.announcement?.club?.name || 'Club'}
                                        </p>
                                        <div className="mt-2">
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {new Date(app.appliedAt).toLocaleDateString('it-IT')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {applications.length > maxItems && (
                <Link
                    href="/opportunities"
                    className="block mt-4 text-center py-2 text-primary hover:text-blue-700 font-semibold text-sm"
                >
                    Vedi tutte le candidature →
                </Link>
            )}
        </div>
    )
}
