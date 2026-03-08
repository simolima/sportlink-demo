'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MegaphoneIcon, CalendarIcon, PlusIcon, ExclamationTriangleIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
            <div className="glass-widget rounded-2xl overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
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
            <div className="glass-widget rounded-2xl overflow-hidden">
                <div className="px-6 py-8 text-center glass-subtle-text">Seleziona una società per vedere gli annunci.</div>
            </div>
        )
    }

    return (
        <div className="glass-widget rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="glass-widget-header px-6 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/25 rounded-lg flex items-center justify-center">
                            <MegaphoneIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">I Miei Annunci</h3>
                            <p className="text-xs glass-subtle-text">{activeAnnouncements.length} annunci attivi</p>
                        </div>
                    </div>
                    {clubId && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/club-applications?clubId=${clubId}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
                            >
                                Tutti
                                <ChevronRightIcon className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/opportunities/new?clubId=${clubId}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Nuovo
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
                {displayAnnouncements.length === 0 ? (
                    <div className="text-center">
                        <MegaphoneIcon className="w-12 h-12 text-secondary/45 mx-auto mb-3" />
                        <p className="glass-subtle-text text-sm mb-4">Nessun annuncio attivo</p>
                        {clubId && (
                            <Link
                                href={`/clubs/${clubId}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
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
                                    href={`/club-applications?clubId=${clubId}&opportunityId=${announcement.id}`}
                                    key={announcement.id}
                                    className={`min-w-[230px] max-w-[260px] snap-start p-4 rounded-xl border border-base-300 hover:shadow-sm transition bg-base-300/65 ${expired ? 'bg-error/20 border-error/40' : expiringSoon ? 'bg-amber-500/15 border-amber-400/40' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-semibold text-white leading-snug line-clamp-2">{announcement.title}</h4>
                                        {expired && <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                        {expiringSoon && !expired && <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs glass-subtle-text">
                                        <span className="px-2 py-0.5 bg-primary/15 text-primary rounded-full">{announcement.roleRequired}</span>
                                        {announcement.applicationsCount !== undefined && (
                                            <span className="glass-subtle-text">{announcement.applicationsCount} candidature</span>
                                        )}
                                    </div>
                                    <div className={`mt-3 text-xs flex items-center gap-1 ${expired ? 'text-red-300' : expiringSoon ? 'text-amber-300' : 'glass-subtle-text'}`}>
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
                <div className="px-6 py-3 bg-base-300/35 border-t border-base-300/60">
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
