'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BuildingOffice2Icon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface Club {
    id: number | string
    name: string
    logoUrl?: string
    city?: string
    sport?: string
    memberCount?: number
}

export interface YourClubWidgetProps {
    userId: string
    clubId?: string | number
}

export default function YourClubWidget({ userId, clubId }: YourClubWidgetProps) {
    const [club, setClub] = useState<Club | null>(null)
    const [memberRole, setMemberRole] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check club memberships
                const memRes = await fetch(`/api/club-memberships?userId=${userId}`)
                if (memRes.ok) {
                    const memberships = await memRes.json()
                    const myMembership = memberships.find((m: any) =>
                        (m.userId === userId || m.userId?.toString() === userId?.toString()) &&
                        m.isActive !== false &&
                        (!clubId || String(m.clubId) === String(clubId))
                    ) || memberships.find((m: any) =>
                        (m.userId === userId || m.userId?.toString() === userId?.toString()) && m.isActive !== false
                    )

                    if (myMembership) {
                        setMemberRole(myMembership.role || 'Membro')
                        // Prefer enriched club info from memberships API
                        if (myMembership.club) {
                            setClub({
                                id: myMembership.club.id,
                                name: myMembership.club.name,
                                logoUrl: myMembership.club.logoUrl,
                                city: myMembership.club.city,
                                sport: Array.isArray(myMembership.club.sports) ? myMembership.club.sports.join(', ') : myMembership.club.sport,
                                memberCount: myMembership.club.memberCount,
                            })
                        } else {
                            // Fallback: fetch all clubs and pick the one
                            const clubRes = await fetch('/api/clubs')
                            if (clubRes.ok) {
                                const allClubs = await clubRes.json()
                                const foundClub = allClubs.find((c: any) => c.id?.toString() === myMembership.clubId?.toString())
                                if (foundClub) {
                                    setClub(foundClub)
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching club:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

    if (loading) {
        return (
            <div className="bg-base-200 rounded-xl shadow-sm border border-base-300 overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        )
    }

    if (!club) {
        return (
            <div className="bg-base-200 rounded-xl shadow-sm border border-base-300 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary">Il Tuo Club</h3>
                            <p className="text-xs text-secondary/60">La tua squadra attuale</p>
                        </div>
                    </div>
                </div>

                {/* No Club */}
                <div className="px-6 py-8 text-center">
                    <BuildingOffice2Icon className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                    <p className="text-secondary/70 text-sm mb-4">Non sei ancora membro di un club</p>
                    <Link
                        href="/clubs"
                        className="inline-flex items-center gap-2 px-4 py-2 btn btn-primary text-sm"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        Cerca un Club
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-base-200 rounded-xl shadow-sm border border-base-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary">Il Tuo Club</h3>
                            <p className="text-xs text-secondary/60">La tua squadra attuale</p>
                        </div>
                    </div>
                    <Link
                        href={`/clubs/${club.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                        Vai al club →
                    </Link>
                </div>
            </div>

            {/* Club Card */}
            <Link href={`/clubs/${club.id}`} className="block p-6 hover:bg-base-300 transition">
                <div className="flex items-center gap-4">
                    {club.logoUrl ? (
                        <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="w-16 h-16 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                            {club.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1">
                        <h4 className="font-bold text-secondary text-lg">{club.name}</h4>
                        <p className="text-sm text-secondary/60">{club.city || club.sport}</p>
                        {memberRole && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded-full">
                                {memberRole}
                            </span>
                        )}
                    </div>
                    {club.memberCount !== undefined && (
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-gray-500">
                                <UserGroupIcon className="w-4 h-4" />
                                <span className="text-sm">{club.memberCount}</span>
                            </div>
                            <div className="text-xs text-gray-400">membri</div>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    )
}
