"use client"
import React from 'react'
import Link from 'next/link'
import { Opportunity } from '@/lib/types'

interface AnnouncementsWidgetProps {
    announcements: Opportunity[]
    title?: string
    subtitle?: string
    maxItems?: number
    emptyMessage?: string
}

export default function AnnouncementsWidget({
    announcements,
    title = 'Annunci Rilevanti',
    subtitle = 'Opportunità che corrispondono al tuo profilo',
    maxItems = 5,
    emptyMessage = 'Nessun annuncio disponibile al momento'
}: AnnouncementsWidgetProps) {
    const displayedItems = announcements.slice(0, maxItems)

    return (
        <div className="glass-widget rounded-2xl overflow-hidden">
            <div className="glass-widget-header px-6 py-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm glass-subtle-text mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 px-6 text-center">
                    <div className="text-secondary/55 mb-2">📭</div>
                    <p className="glass-subtle-text">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3 px-6 py-5">
                    {displayedItems.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="p-4 border border-base-300 rounded-xl bg-base-300/60 hover:border-primary/35 hover:bg-base-300/85 transition"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-white">{announcement.title}</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                                            {announcement.sport}
                                        </span>
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                            {announcement.type}
                                        </span>
                                        {announcement.city && (
                                            <span className="text-xs bg-base-200/75 text-secondary px-2 py-1 rounded">
                                                📍 {announcement.city}
                                            </span>
                                        )}
                                    </div>
                                    {announcement.description && (
                                        <p className="text-sm glass-subtle-text mt-2 line-clamp-2">
                                            {announcement.description}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    href={`/opportunities?announcementId=${announcement.id}`}
                                    className="px-3 py-2 bg-primary hover:bg-brand-700 text-white text-sm rounded-lg transition whitespace-nowrap"
                                >
                                    Candida →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {announcements.length > maxItems && (
                <Link
                    href="/opportunities"
                    className="block mt-1 mb-5 text-center py-2 text-primary hover:text-brand-700 font-semibold text-sm"
                >
                    Vedi tutti ({announcements.length}) →
                </Link>
            )}
        </div>
    )
}
