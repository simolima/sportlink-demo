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
}

export default function MyAnnouncementsWidget({ userId }: MyAnnouncementsWidgetProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [clubId, setClubId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const maxItems = 5

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get clubs where user is admin
                const clubsRes = await fetch('/api/clubs')
                if (clubsRes.ok) {
                    const clubs = await clubsRes.json()
                    const myClub = clubs.find((c: any) =>
                        c.adminId === userId ||
                        c.presidentId === userId ||
                        c.directorId === userId ||
                        c.sportingDirectorId === userId
                    )

                    if (myClub) {
                        setClubId(String(myClub.id))

                        // Get announcements for this club
                        const annRes = await fetch('/api/opportunities')
                        if (annRes.ok) {
                            const allAnnouncements = await annRes.json()
                            const myAnnouncements = allAnnouncements.filter((a: any) =>
                                String(a.clubId) === String(myClub.id)
                            ).map((a: any) => ({
                                ...a,
                                isActive: new Date(a.expiryDate) > new Date()
                            }))
                            setAnnouncements(myAnnouncements)
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching announcements:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

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
    const displayAnnouncements = activeAnnouncements.slice(0, maxItems)

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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MegaphoneIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">I Miei Annunci</h3>
                            <p className="text-xs text-gray-500">{activeAnnouncements.length} annunci attivi</p>
                        </div>
                    </div>
                    {clubId && (
                        <Link
                            href={`/clubs/${clubId}`}
                            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Nuovo
                        </Link>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-100">
                {displayAnnouncements.length === 0 ? (
                    <div className="px-6 py-8 text-center">
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
                    displayAnnouncements.map((announcement) => {
                        const expiringSoon = isExpiringSoon(announcement.expiryDate)
                        const expired = isExpired(announcement.expiryDate)

                        return (
                            <div
                                key={announcement.id}
                                className={`px-6 py-4 ${expired ? 'bg-red-50' : expiringSoon ? 'bg-amber-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900 truncate">{announcement.title}</h4>
                                            {expired && (
                                                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            )}
                                            {expiringSoon && !expired && (
                                                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                                {announcement.roleRequired}
                                            </span>
                                            {announcement.applicationsCount !== undefined && (
                                                <span className="text-gray-500">
                                                    {announcement.applicationsCount} candidature
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap">
                                        <div className={`flex items-center gap-1 ${expired ? 'text-red-500' : expiringSoon ? 'text-amber-500' : 'text-gray-400'}`}>
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {expired ? 'Scaduto' : `Scade: ${new Date(announcement.expiryDate).toLocaleDateString('it-IT')}`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Footer */}
            {activeAnnouncements.length > maxItems && (
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
