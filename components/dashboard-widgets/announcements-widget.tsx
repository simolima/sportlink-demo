"use client"
import React from 'react'
import Link from 'next/link'
import { Announcement } from '@/lib/types'

interface AnnouncementsWidgetProps {
    announcements: Announcement[]
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">📭</div>
                    <p className="text-gray-600">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedItems.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                            {announcement.sport}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {announcement.type}
                                        </span>
                                        {announcement.city && (
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                📍 {announcement.city}
                                            </span>
                                        )}
                                    </div>
                                    {announcement.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {announcement.description}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    href={`/opportunities?announcementId=${announcement.id}`}
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition whitespace-nowrap"
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
                    className="block mt-4 text-center py-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                >
                    Vedi tutti ({announcements.length}) →
                </Link>
            )}
        </div>
    )
}
