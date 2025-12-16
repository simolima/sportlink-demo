'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UsersIcon, UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline'

interface Athlete {
    id: number | string
    name: string
    avatarUrl?: string
    sport?: string
    role?: string
}

export interface RosterOverviewWidgetProps {
    userId: string
}

export default function RosterOverviewWidget({ userId }: RosterOverviewWidgetProps) {
    const [totalAthletes, setTotalAthletes] = useState(0)
    const [pendingRequests, setPendingRequests] = useState(0)
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch affiliations for this agent
                const affRes = await fetch('/api/affiliations')
                if (affRes.ok) {
                    const affiliations = await affRes.json()
                    const myAffiliations = affiliations.filter((a: any) => a.agentId === userId)
                    const accepted = myAffiliations.filter((a: any) => a.status === 'accepted')
                    const pending = myAffiliations.filter((a: any) => a.status === 'pending')

                    setTotalAthletes(accepted.length)
                    setPendingRequests(pending.length)

                    // Get athlete details for recent ones
                    if (accepted.length > 0) {
                        const userRes = await fetch('/api/users')
                        if (userRes.ok) {
                            const users = await userRes.json()
                            const athleteDetails = accepted.slice(0, 5).map((aff: any) => {
                                const user = users.find((u: any) => String(u.id) === String(aff.athleteId))
                                return user ? {
                                    id: user.id,
                                    name: user.name,
                                    avatarUrl: user.avatarUrl,
                                    sport: user.sport,
                                    role: user.role
                                } : null
                            }).filter(Boolean)
                            setAthletes(athleteDetails)
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching roster:', error)
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Panoramica Roster</h3>
                            <p className="text-xs text-gray-500">I tuoi atleti assistiti</p>
                        </div>
                    </div>
                    <Link
                        href="/agent/affiliations"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Gestisci →
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Total Athletes */}
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-indigo-700">{totalAthletes}</div>
                        <div className="text-xs text-indigo-600">Atleti Assistiti</div>
                    </div>

                    {/* Pending Requests */}
                    <div className={`text-center p-4 rounded-lg ${pendingRequests > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        {pendingRequests > 0 ? (
                            <>
                                <ClockIcon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-amber-700">{pendingRequests}</div>
                                <div className="text-xs text-amber-600">Richieste Pendenti</div>
                            </>
                        ) : (
                            <>
                                <UserPlusIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-gray-500">0</div>
                                <div className="text-xs text-gray-500">Richieste Pendenti</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                {pendingRequests > 0 && (
                    <Link
                        href="/player/affiliations"
                        className="block w-full text-center px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition text-sm"
                    >
                        Gestisci Richieste Affiliazione
                    </Link>
                )}

                {/* Recent Athletes Preview */}
                {athletes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-3">Atleti recenti</div>
                        <div className="flex -space-x-2">
                            {athletes.slice(0, 5).map((athlete) => (
                                <Link
                                    key={athlete.id}
                                    href={`/profile/${athlete.id}`}
                                    className="relative"
                                >
                                    {athlete.avatarUrl ? (
                                        <img
                                            src={athlete.avatarUrl}
                                            alt={athlete.name}
                                            className="w-10 h-10 rounded-full border-2 border-white object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                                            {athlete.name.charAt(0)}
                                        </div>
                                    )}
                                </Link>
                            ))}
                            {athletes.length > 5 && (
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold">
                                    +{athletes.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
