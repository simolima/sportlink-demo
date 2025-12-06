"use client"

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import AnnouncementsWidget from '@/components/dashboard-widgets/announcements-widget'
import ApplicationsWidget from '@/components/dashboard-widgets/applications-widget'
import ClubsWidget from '@/components/dashboard-widgets/clubs-widget'
import AthletesWidget from '@/components/dashboard-widgets/athletes-widget'
import PendingActionsWidget from '@/components/dashboard-widgets/pending-actions-widget'
import PostComposer from '@/components/post-composer'
import PostCard from '@/components/post-card'

export default function HomePage() {
    const { user, isLoading } = useRequireAuth(true)
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [applications, setApplications] = useState<any[]>([])
    const [clubs, setClubs] = useState<any[]>([])
    const [athletes, setAthletes] = useState<any[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [pendingActions, setPendingActions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return

            setLoading(true)
            try {
                // Fetch announcements
                const announcementsRes = await fetch('/api/announcements')
                const announcementsData = await announcementsRes.json()
                setAnnouncements(Array.isArray(announcementsData) ? announcementsData.filter((a: any) => a.isActive) : [])

                // Fetch applications
                const applicationsRes = await fetch(`/api/applications?playerId=${user.id}`)
                const applicationsData = await applicationsRes.json()
                setApplications(Array.isArray(applicationsData) ? applicationsData : [])

                // Fetch club memberships
                const membershipsRes = await fetch(`/api/club-memberships?userId=${user.id}`)
                const membershipsData = await membershipsRes.json()
                setClubs(Array.isArray(membershipsData) ? membershipsData : [])

                // Fetch posts
                const postsRes = await fetch('/api/posts')
                const postsData = await postsRes.json()
                setPosts(Array.isArray(postsData) ? postsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])

                // Fetch users for athletes widget (agents only)
                if (user.professionalRole === 'Agent') {
                    const usersRes = await fetch('/api/users')
                    const usersData = await usersRes.json()
                    // Filter to show affiliated players
                    const affiliated = Array.isArray(usersData)
                        ? usersData.filter((u: any) => u.professionalRole === 'Player').slice(0, 5)
                        : []
                    setAthletes(affiliated)
                }

                // Set pending actions based on role
                const actions: any[] = []
                if (user.professionalRole === 'President' || user.professionalRole === 'Director') {
                    // Club admins: pending applications to review
                    const pendingCount = applicationsData.filter((app: any) => app.status === 'pending').length
                    if (pendingCount > 0) {
                        actions.push({
                            id: 'pending-reviews',
                            title: 'Candidature in Sospeso',
                            description: 'Candidature che attendono la tua revisione',
                            count: pendingCount,
                            action: 'Rivedi',
                            actionUrl: '/opportunities'
                        })
                    }
                }

                // Check for agent requests (players only)
                if (user.professionalRole === 'Player') {
                    const affiliationsRes = await fetch(`/api/affiliations?playerId=${user.id}&status=pending`)
                    const affiliationsData = await affiliationsRes.json()
                    const pendingRequests = Array.isArray(affiliationsData) ? affiliationsData.length : 0
                    if (pendingRequests > 0) {
                        actions.push({
                            id: 'pending-agents',
                            title: 'Richieste Agente',
                            description: 'Agenti che vogliono rappresentarti',
                            count: pendingRequests,
                            action: 'Rivedi',
                            actionUrl: '/profile'
                        })
                    }
                }

                setPendingActions(actions)
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [user])

    if (isLoading || !user) {
        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Caricamento dashboard...</p>
                </div>
            </div>
        )
    }

    const userName = `${user.firstName} ${user.lastName}`
    const userPhoto = user.avatarUrl

    const isPlayer = ['Player', 'Coach', 'Physio/Masseur'].includes(user.professionalRole)
    const isAgent = user.professionalRole === 'Agent'
    const isClubAdmin = ['President', 'Director', 'Sporting Director'].includes(user.professionalRole)

    return (
        <div className="w-full min-h-screen bg-gray-50">
            {/* Hero Section with Welcome Message */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Benvenuto, {user.firstName}! 👋
                    </h1>
                    <p className="text-green-100 text-lg">
                        {user.sport} • {user.professionalRole}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Pending Actions (if any) */}
                {pendingActions.length > 0 && (
                    <div className="mb-8">
                        <PendingActionsWidget items={pendingActions} />
                    </div>
                )}

                {/* Role-Based Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Post Composer */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <PostComposer userName={userName} userPhoto={userPhoto} />
                        </div>

                        {/* Feed */}
                        <div className="space-y-4">
                            {posts.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                    <p className="text-gray-500">Nessun post disponibile</p>
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar Widgets */}
                    <div className="space-y-6">
                        {/* Player/Coach/Staff Dashboard */}
                        {isPlayer && (
                            <>
                                <AnnouncementsWidget
                                    announcements={announcements}
                                    maxItems={3}
                                    emptyMessage="Nessun annuncio corrispondente al tuo profilo"
                                />
                                <ApplicationsWidget
                                    applications={applications}
                                    maxItems={3}
                                    emptyMessage="Non hai candidature ancora"
                                />
                            </>
                        )}

                        {/* Agent Dashboard */}
                        {isAgent && (
                            <>
                                <AthletesWidget
                                    athletes={athletes}
                                    maxItems={5}
                                    emptyMessage="Inizia a cercare giocatori da rappresentare"
                                />
                                <AnnouncementsWidget
                                    announcements={announcements.slice(0, 3)}
                                    title="Nuovi Annunci"
                                    subtitle="Opportunità per i tuoi atleti"
                                    maxItems={3}
                                />
                            </>
                        )}

                        {/* Club Admin Dashboard */}
                        {isClubAdmin && (
                            <>
                                <PendingActionsWidget
                                    title="Gestione Club"
                                    items={[
                                        {
                                            id: 'club-members',
                                            title: 'Membri del Club',
                                            count: clubs.length,
                                            action: 'Gestisci',
                                            actionUrl: '/clubs'
                                        }
                                    ]}
                                />
                            </>
                        )}

                        {/* Universal: Clubs Widget (shown to all) */}
                        <ClubsWidget
                            clubs={clubs}
                            maxItems={3}
                            emptyMessage="Unisciti a un club per iniziare"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
