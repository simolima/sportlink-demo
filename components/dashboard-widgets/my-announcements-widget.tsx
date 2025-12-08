'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MegaphoneIcon, CalendarIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Announcement {
    id: number | string
    title: string
    type: string
    roleRequired: string
    applicationsCount?: number
    expiryDate: string
    isActive: boolean
}

export interface MyAnnouncementsWidgetProps {
    userId: string
    clubId?: string | number
}

export default function MyAnnouncementsWidget({ userId, clubId }: MyAnnouncementsWidgetProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const MAX_ANNOUNCEMENTS = 15

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!clubId) return

                const annRes = await fetch(`/api/opportunities?clubId=${clubId}&activeOnly=true`)
                if (annRes.ok) {
                    const allAnnouncements = await annRes.json()
                    const myAnnouncements = allAnnouncements
                        .map((a: any) => ({
                            ...a,
                            isActive: new Date(a.expiryDate) > new Date()
                        }))
                        .slice(0, MAX_ANNOUNCEMENTS)
                    setAnnouncements(myAnnouncements)
                }
            } catch (error) {
                console.error('Error fetching announcements:', error)
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    const activeAnnouncements = announcements.filter(a => a.isActive)
    const displayAnnouncements = activeAnnouncements.slice(0, MAX_ANNOUNCEMENTS)

    // Check for expiring soon (within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const isExpiringSoon = (expiryDate: string) => {
        const expiry = new Date(expiryDate)
        return expiry <= sevenDaysFromNow && expiry > now
    }

    const isExpired = (expiryDate: string) => {
        return new Date(expiryDate) <= now
    }

    if (!clubId) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-8 text-center text-gray-500">Seleziona una società per vedere gli annunci.</div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MegaphoneIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">I Miei Annunci</h3>
                            <p className="text-xs text-gray-500">{activeAnnouncements.length} annunci attivi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/opportunities?clubId=${clubId}`}
                            className="text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            Vai a tutti
                        </Link>
                        <Link
                            href={`/clubs/${clubId}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Nuovo
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
                {displayAnnouncements.length === 0 ? (
                    <div className="text-center">
                        <MegaphoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">Nessun annuncio attivo</p>
                        {clubId && (
                            <Link
                                href={`/clubs/${clubId}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Crea Annuncio
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                        {displayAnnouncements.map((announcement) => {
                            const expiringSoon = isExpiringSoon(announcement.expiryDate)
                            const expired = isExpired(announcement.expiryDate)

                            return (
                                <Link
                                    href={`/opportunities?focus=${announcement.id}`}
                                    key={announcement.id}
                                    className={`min-w-[230px] max-w-[260px] snap-start p-4 rounded-lg border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition bg-white ${expired ? 'bg-red-50 border-red-100' : expiringSoon ? 'bg-amber-50 border-amber-100' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900 leading-snug line-clamp-2">{announcement.title}</h4>
                                        {expired && <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                        {expiringSoon && !expired && <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{announcement.roleRequired}</span>
                                        {announcement.applicationsCount !== undefined && (
                                            <span className="text-gray-500">{announcement.applicationsCount} candidature</span>
                                        )}
                                    </div>
                                    <div className={`mt-3 text-xs flex items-center gap-1 ${expired ? 'text-red-600' : expiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        {expired ? 'Scaduto' : `Scade: ${new Date(announcement.expiryDate).toLocaleDateString('it-IT')}`}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {activeAnnouncements.length > MAX_ANNOUNCEMENTS && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <Link
                        href={clubId ? `/clubs/${clubId}` : '/clubs'}
                        className="text-sm text-center block text-orange-600 hover:text-orange-700 font-medium"
                    >
                        Vedi tutti gli annunci ({activeAnnouncements.length})
                    </Link>
                </div>
            )}
        </div>
    )
}
