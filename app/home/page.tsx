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

// Ruoli che vedono la dashboard Player
const PLAYER_ROLES = ['Player']

// Ruoli che vedono la dashboard Coach
const COACH_ROLES = ['Coach']

// Ruoli che vedono la dashboard Agent
const AGENT_ROLES = ['Agent']

// Ruoli che vedono la dashboard Sporting Director / Club Admin
const DS_ROLES = ['Sporting Director']

// Ruoli Staff (Athletic Trainer, Nutritionist, Physio/Masseur)
const STAFF_ROLES = ['Athletic Trainer', 'Nutritionist', 'Physio/Masseur']

export default function HomePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('')
    const [userName, setUserName] = useState<string>('')
    const [isClubAdmin, setIsClubAdmin] = useState(false)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }

        const role = localStorage.getItem('currentUserRole') || ''
        const name = localStorage.getItem('currentUserName') || ''

        setUserId(id)
        setUserRole(role)
        setUserName(name)

        // Verifica se è admin di un club
        checkClubAdmin(id)
        setLoading(false)
    }, [router])

    const checkClubAdmin = async (id: string) => {
        try {
            const res = await fetch('/api/clubs')
            if (res.ok) {
                const clubs = await res.json()
                const adminClub = clubs.find((c: any) =>
                    c.adminId === id ||
                    c.presidentId === id ||
                    c.directorId === id ||
                    c.sportingDirectorId === id
                )
                setIsClubAdmin(!!adminClub)
            }
        } catch (error) {
            console.error('Error checking club admin:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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

                {/* Dashboard per Player */}
                {isPlayer && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                            La tua carriera
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <OpportunitiesForYouWidget userId={userId!} userRole={userRole} />
                            <YourApplicationsWidget userId={userId!} />
                            <YourClubWidget userId={userId!} />
                        </div>
                    </div>
                )}

                {/* Dashboard per Coach */}
                {isCoach && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                            La tua carriera
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <OpportunitiesForYouWidget userId={userId!} userRole={userRole} />
                            <YourApplicationsWidget userId={userId!} />
                            <YourClubWidget userId={userId!} />
                        </div>
                    </div>
                )}

                {/* Dashboard per Agent */}
                {isAgent && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
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
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                            Gestione Club
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ReceivedApplicationsWidget userId={userId!} />
                            <MyAnnouncementsWidget userId={userId!} />
                        </div>
                    </div>
                )}

                {/* Dashboard per Staff (Athletic Trainer, Nutritionist, Physio/Masseur) */}
                {isStaff && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
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
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Vai al profilo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
