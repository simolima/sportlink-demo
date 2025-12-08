'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BriefcaseIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'

interface MarketOpportunity {
    id: number | string
    title: string
    clubName?: string
    roleRequired: string
    position?: string
    city?: string
    matchingAthletes?: number
}

export interface AgentMarketWidgetProps {
    userId: string
}

export default function AgentMarketWidget({ userId }: AgentMarketWidgetProps) {
    const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const maxItems = 5

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get agent's athletes
                const affRes = await fetch('/api/affiliations')
                const usersRes = await fetch('/api/users')
                const annRes = await fetch('/api/opportunities')

                if (affRes.ok && usersRes.ok && annRes.ok) {
                    const affiliations = await affRes.json()
                    const users = await usersRes.json()
                    const announcements = await annRes.json()

                    const myAthleteIds = affiliations
                        .filter((a: any) => a.agentId === userId && a.status === 'accepted')
                        .map((a: any) => a.athleteId)

                    const myAthletes = users.filter((u: any) => myAthleteIds.includes(String(u.id)))

                    // Match announcements with athletes
                    const matchedOpportunities = announcements.map((ann: any) => {
                        const matching = myAthletes.filter((a: any) =>
                            a.sport === ann.sport &&
                            (a.role === ann.roleRequired || ann.roleRequired === 'Any')
                        )
                        return {
                            ...ann,
                            matchingAthletes: matching.length
                        }
                    }).filter((o: any) => o.matchingAthletes > 0)

                    setOpportunities(matchedOpportunities)
                }
            } catch (error) {
                console.error('Error fetching market:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

    const displayOpportunities = opportunities.slice(0, maxItems)

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <BriefcaseIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Mercato</h3>
                            <p className="text-xs text-gray-500">Opportunità per i tuoi atleti</p>
                        </div>
                    </div>
                    <Link
                        href="/opportunities"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
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
                        <p className="text-gray-500 text-sm">Nessuna opportunità rilevante</p>
                        <p className="text-gray-400 text-xs mt-1">Gli annunci appariranno qui quando matchano i ruoli dei tuoi atleti</p>
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
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                            {opp.roleRequired}
                                        </span>
                                        {opp.position && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                {opp.position}
                                            </span>
                                        )}
                                        {opp.city && (
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <MapPinIcon className="w-3 h-3" />
                                                {opp.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {opp.matchingAthletes !== undefined && opp.matchingAthletes > 0 && (
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                                            <UserIcon className="w-4 h-4" />
                                            {opp.matchingAthletes}
                                        </div>
                                        <div className="text-xs text-gray-400">match</div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Footer */}
            {displayOpportunities.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                        {opportunities.length} opportunità rilevanti per i tuoi atleti
                    </p>
                </div>
            )}
        </div>
    )
}
