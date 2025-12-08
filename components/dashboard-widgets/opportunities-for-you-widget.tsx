'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BriefcaseIcon, MapPinIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useRef } from 'react'

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
    const [userApplications, setUserApplications] = useState<any[]>([])
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const MAX_OPPORTUNITIES = 15

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user to get sport - fetch all users and find current
                const userRes = await fetch(`/api/users`)
                if (userRes.ok) {
                    const users = await userRes.json()
                    const user = users.find((u: any) => u.id.toString() === userId)
                    if (!user) {
                        console.error('User not found:', userId)
                        setLoading(false)
                        return
                    }

                    const sportValue = (user.sport || (Array.isArray(user.sports) ? user.sports[0] : '') || '').trim()
                    const normalizedSport = sportValue.toLowerCase()
                    setUserSport(sportValue)

                    // Fetch user applications to exclude ones with any status
                    let userApps: any[] = []
                    const appsRes = await fetch(`/api/applications?applicantId=${userId}`)
                    if (appsRes.ok) {
                        userApps = await appsRes.json()
                        setUserApplications(userApps)
                    }

                    // Fetch announcements matching user sport and role
                    const annRes = await fetch(`/api/opportunities?activeOnly=true`)
                    if (annRes.ok) {
                        const announcements = await annRes.json()
                        const matching = announcements
                            .filter((a: any) => {
                                const annSport = (a.sport || '').toLowerCase()
                                const roleRequired = a.roleRequired || ''
                                const sportMatches = normalizedSport ? annSport === normalizedSport : true
                                const roleMatches = roleRequired === userRole || roleRequired === 'Any'
                                return sportMatches && roleMatches
                            })
                            // Exclude opportunities where user already has ANY application (pending, accepted, etc)
                            .filter((a: any) => {
                                const hasApplication = userApps.some((app: any) =>
                                    app.opportunityId?.toString() === a.id.toString()
                                )
                                return !hasApplication
                            })
                            // Limit to max 15
                            .slice(0, MAX_OPPORTUNITIES)

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

    // Check scroll position
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkScroll)
            return () => container.removeEventListener('scroll', checkScroll)
        }
    }, [opportunities])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320 // card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            })
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">Caricamento...</div>
            </div>
        )
    }

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
            {opportunities.length === 0 ? (
                <div className="px-6 py-8 text-center">
                    <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nessuna opportunità al momento</p>
                    <p className="text-gray-400 text-xs mt-1">Controlla regolarmente per nuovi annunci</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Left scroll button */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-r-lg shadow-md"
                        >
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    )}

                    {/* Horizontal scroll container */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto scrollbar-hide flex gap-4 p-4"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {opportunities.map((opp) => (
                            <Link
                                key={opp.id}
                                href={`/opportunities`}
                                className="flex-shrink-0 w-80 bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition cursor-pointer border border-gray-200"
                            >
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900 line-clamp-2">{opp.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        {opp.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-3.5 h-3.5" />
                                                {opp.city}
                                            </span>
                                        )}
                                        {opp.position && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                {opp.position}
                                            </span>
                                        )}
                                    </div>
                                    {opp.level && (
                                        <p className="text-xs text-gray-500">
                                            Livello: <span className="font-medium">{opp.level}</span>
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        Scade: {new Date(opp.expiryDate).toLocaleDateString('it-IT')}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Right scroll button */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-l-lg shadow-md"
                        >
                            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
