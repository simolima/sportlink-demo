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
    pending: { bg: 'bg-warning/20', text: 'text-warning', label: 'In Sospeso' },
    in_review: { bg: 'bg-primary/20', text: 'text-primary', label: 'In Revisione' },
    accepted: { bg: 'bg-success/10', text: 'text-success', label: 'Accettata' },
    rejected: { bg: 'bg-error/20', text: 'text-error', label: 'Rifiutata' },
    withdrawn: { bg: 'bg-base-200/75', text: 'text-secondary', label: 'Ritirata' }
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
        <div className="glass-widget rounded-2xl overflow-hidden">
            <div className="glass-widget-header px-6 py-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm glass-subtle-text mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 px-6 text-center">
                    <div className="text-secondary/55 mb-2">📋</div>
                    <p className="glass-subtle-text">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3 px-6 py-5">
                    {displayedItems.map((app) => {
                        const statusInfo = STATUS_COLORS[app.status as ApplicationStatus]
                        return (
                            <div
                                key={app.id}
                                className="p-4 border border-base-300 rounded-xl bg-base-300/60 hover:border-primary/35 transition"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white">
                                            {app.announcement?.title || 'Opportunità'}
                                        </h4>
                                        <p className="text-sm glass-subtle-text mt-1">
                                            {app.announcement?.club?.name || 'Club'}
                                        </p>
                                        <div className="mt-2">
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs glass-quiet-text">
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
                    className="block mt-1 mb-5 text-center py-2 text-primary hover:text-brand-700 font-semibold text-sm"
                >
                    Vedi tutte le candidature →
                </Link>
            )}
        </div>
    )
}
