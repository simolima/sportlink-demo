"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    OpportunitiesForYouWidget,
    YourApplicationsWidget,
    YourClubWidget,
    RosterOverviewWidget,
    AgentMarketWidget,
    ReceivedApplicationsWidget,
    MyAnnouncementsWidget
} from '@/components/dashboard-widgets'
import ClubJoinRequestsWidget from '@/components/dashboard-widgets/club-join-requests-widget'

// Ruoli che vedono la dashboard Player (valori dal DB: lowercase con underscore)
const PLAYER_ROLES = ['player']

// Ruoli che vedono la dashboard Coach
const COACH_ROLES = ['coach']

// Ruoli che vedono la dashboard Agent
const AGENT_ROLES = ['agent']

// Ruoli che vedono la dashboard Sporting Director / Club Admin
const DS_ROLES = ['sporting_director']

// Ruoli Staff (Athletic Trainer, Nutritionist, Physio/Masseur, Talent Scout)
const STAFF_ROLES = ['athletic_trainer', 'nutritionist', 'physio', 'talent_scout']

export default function HomePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('')
    const [userName, setUserName] = useState<string>('')
    const [isClubAdmin, setIsClubAdmin] = useState(false)
    const [adminClubs, setAdminClubs] = useState<Array<{ id: string; name: string }>>([])
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }

        const role = localStorage.getItem('currentUserRole') || ''
        const name = localStorage.getItem('currentUserName') || ''
        const sportsJson = localStorage.getItem('currentUserSports')
        const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true'

        // Debug: log localStorage values
        console.log('🔍 Home page localStorage check:', {
            role,
            name,
            sportsJson,
            onboardingComplete,
            hasRole: !!role,
            hasSports: !!sportsJson
        })

        // If missing role or sports, try to load from DB before redirecting
        if ((!role || !sportsJson) && !onboardingComplete) {
            console.log('⚠️ Missing data in localStorage, attempting to fetch from DB...')
            fetchUserDataFromDB(id).then(success => {
                if (!success) {
                    // Only redirect if DB fetch also fails
                    console.log('⚠️ Incomplete profile detected, redirecting to onboarding...')
                    if (!name || name === 'User OAuth') {
                        window.location.href = '/complete-profile'
                    } else if (!role) {
                        window.location.href = '/profile-setup?oauth=true'
                    } else {
                        window.location.href = '/select-sport'
                    }
                }
            })
            return
        }

        setUserId(id)
        setUserRole(role)
        setUserName(name)

        // Verifica club admin e popola selector
        checkClubAdmin(id)
    }, [router])

    const fetchUserDataFromDB = async (userId: string): Promise<boolean> => {
        try {
            const { supabase } = await import('@/lib/supabase-browser')
            
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role_id, first_name, last_name')
                .eq('id', userId)
                .single()

            if (profileError || !profile) {
                console.error('Failed to fetch profile from DB:', profileError)
                return false
            }

            // Fetch sports
            const { data: userSports, error: sportsError } = await supabase
                .from('profile_sports')
                .select('sport_id, lookup_sports(name)')
                .eq('user_id', userId)

            const sports = userSports?.map((ps: any) => ps.lookup_sports?.name).filter(Boolean) || []

            if (profile.role_id && sports.length > 0) {
                // Update localStorage with fetched data
                console.log('✅ Fetched data from DB, updating localStorage:', { role: profile.role_id, sports })
                localStorage.setItem('currentUserRole', profile.role_id)
                localStorage.setItem('currentUserSports', JSON.stringify(sports))
                localStorage.setItem('currentUserSport', sports[0] || '')
                
                if (profile.first_name && profile.last_name) {
                    localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                }

                // Reload page to apply changes
                window.location.reload()
                return true
            }

            return false
        } catch (error) {
            console.error('Error fetching user data from DB:', error)
            return false
        }
    }

    const checkClubAdmin = async (id: string) => {
        try {
            const res = await fetch(`/api/club-memberships?userId=${id}`)
            if (res.ok) {
                const memberships = await res.json()
                const adminMemberships = memberships.filter((m: any) =>
                    (m.userId === id || m.userId === String(id)) && m.role === 'Admin' && m.isActive !== false
                )

                const clubs = adminMemberships.map((m: any) => ({
                    id: m.clubId?.toString(),
                    name: m.club?.name || `Club ${m.clubId}`,
                })).filter((c: any) => c.id)

                setAdminClubs(clubs)
                setIsClubAdmin(clubs.length > 0)

                // Restore last selection or default to first
                const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedClubId') : null
                const fallbackId = stored && clubs.find((c: any) => c.id === stored) ? stored : (clubs[0]?.id || null)
                setSelectedClubId(fallbackId)
                if (fallbackId) {
                    localStorage.setItem('selectedClubId', fallbackId)
                }
            }
        } catch (error) {
            console.error('Error checking club admin:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    const isPlayer = PLAYER_ROLES.includes(userRole)
    const isCoach = COACH_ROLES.includes(userRole)
    const isAgent = AGENT_ROLES.includes(userRole)
    const isDS = DS_ROLES.includes(userRole)
    const isStaff = STAFF_ROLES.includes(userRole)
    const showClubAdminSection = isClubAdmin || isDS

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Ciao, {userName || 'Utente'}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Ecco cosa c'è di nuovo per te oggi
                    </p>
                </div>

                {/* Sezione Personale (Player / Coach / DS / Staff) */}
                {(isPlayer || isCoach || isDS || isStaff) && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                            Area Personale
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <OpportunitiesForYouWidget userId={userId!} userRole={userRole} />
                            <YourApplicationsWidget userId={userId!} />
                            <YourClubWidget userId={userId!} clubId={selectedClubId || undefined} />
                        </div>
                    </div>
                )}

                {/* Dashboard per Agent */}
                {isAgent && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                            Il tuo lavoro
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RosterOverviewWidget userId={userId!} />
                            <AgentMarketWidget userId={userId!} />
                        </div>
                    </div>
                )}

                {/* Dashboard per Sporting Director / Club Admin */}
                {showClubAdminSection && (
                    <div className="space-y-6 mt-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                                Gestione Società
                            </h2>
                            {adminClubs.length > 1 && (
                                <select
                                    value={selectedClubId || ''}
                                    onChange={(e) => {
                                        const value = e.target.value || null
                                        setSelectedClubId(value)
                                        if (value) localStorage.setItem('selectedClubId', value)
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm"
                                >
                                    {adminClubs.map((club) => (
                                        <option key={club.id} value={club.id}>{club.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {adminClubs.length === 0 || !selectedClubId ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-600">
                                Nessuna società amministrata.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <YourClubWidget userId={userId!} clubId={selectedClubId} />
                                <ReceivedApplicationsWidget userId={userId!} clubId={selectedClubId} />
                                <MyAnnouncementsWidget userId={userId!} clubId={selectedClubId} />
                                <ClubJoinRequestsWidget clubId={selectedClubId} />
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard per Staff (Athletic Trainer, Nutritionist, Physio/Masseur, Talent Scout) */}
                {isStaff && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                            Opportunità per te
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <OpportunitiesForYouWidget userId={userId!} userRole={userRole} />
                            <YourApplicationsWidget userId={userId!} />
                            <YourClubWidget userId={userId!} />
                        </div>
                    </div>
                )}

                {/* Se l'utente non ha nessun ruolo specifico */}
                {!isPlayer && !isCoach && !isAgent && !showClubAdminSection && !isStaff && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Completa il tuo profilo
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Imposta il tuo ruolo per vedere contenuti personalizzati
                        </p>
                        <button
                            onClick={() => router.push(`/profile/${userId}`)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Vai al profilo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
