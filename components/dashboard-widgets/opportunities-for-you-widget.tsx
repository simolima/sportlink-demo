'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BriefcaseIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Opportunity {
    id: number | string
    title: string
    clubName?: string
    sport: string
    roleRequired: string
    position?: string
    city?: string
    expiryDate: string
    level?: string
}

export interface OpportunitiesForYouWidgetProps {
    userId: string
    userRole: string
}

export default function OpportunitiesForYouWidget({ userId, userRole }: OpportunitiesForYouWidgetProps) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [userSport, setUserSport] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const maxItems = 3

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user to get sport
                const userRes = await fetch(`/api/users/${userId}`)
                if (userRes.ok) {
                    const user = await userRes.json()
                    setUserSport(user.sport || '')

                    // Fetch announcements matching user sport and role
                    const annRes = await fetch('/api/opportunities')
                    if (annRes.ok) {
                        const announcements = await annRes.json()
                        const matching = announcements.filter((a: any) =>
                            a.sport === user.sport &&
                            (a.roleRequired === userRole || a.roleRequired === 'Any')
                        )
                        setOpportunities(matching)
                    }
                }
            } catch (error) {
                console.error('Error fetching opportunities:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId, userRole])

    const displayOpportunities = opportunities.slice(0, maxItems)


    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <BriefcaseIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Opportunità per Te</h3>
                            <p className="text-xs text-gray-500">Annunci per {userRole} • {userSport}</p>
                        </div>
                    </div>
                    <Link
                        href="/opportunities"
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                    >
                        Vedi tutte →
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-100">
                {displayOpportunities.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Nessuna opportunità al momento</p>
                        <p className="text-gray-400 text-xs mt-1">Controlla regolarmente per nuovi annunci</p>
                    </div>
                ) : (
                    displayOpportunities.map((opp) => (
                        <Link
                            key={opp.id}
                            href={`/opportunities`}
                            className="block px-6 py-4 hover:bg-gray-50 transition"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">{opp.title}</h4>
                                    {opp.clubName && (
                                        <p className="text-sm text-gray-600 mt-0.5">{opp.clubName}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                        {opp.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-3.5 h-3.5" />
                                                {opp.city}
                                            </span>
                                        )}
                                        {opp.level && (
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                                {opp.level}
                                            </span>
                                        )}
                                        {opp.position && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                {opp.position}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                                    <CalendarIcon className="w-3.5 h-3.5 inline mr-1" />
                                    Scade: {new Date(opp.expiryDate).toLocaleDateString('it-IT')}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Footer */}
            {displayOpportunities.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                        {opportunities.length} opportunità trovate per il tuo profilo
                    </p>
                </div>
            )}
        </div>
    )
}
