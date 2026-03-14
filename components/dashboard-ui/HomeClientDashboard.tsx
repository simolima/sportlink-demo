'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    OpportunitiesForYouWidget,
    YourApplicationsWidget,
    YourClubWidget,
    YourStudioWidget,
    RosterOverviewWidget,
    AgentMarketWidget,
    ReceivedApplicationsWidget,
    MyAnnouncementsWidget
} from '@/components/dashboard-widgets'
import ClubJoinRequestsWidget from '@/components/dashboard-widgets/club-join-requests-widget'
import {
    getSelectedClubStorageKey,
    isClubAdminProfessionalRole,
    membershipMatchesActiveProfessionalRole,
} from '@/lib/club-membership-scope'

const PLAYER_ROLES = ['player']
const COACH_ROLES = ['coach']
const AGENT_ROLES = ['agent']
const DS_ROLES = ['sporting_director']
const STAFF_ROLES = ['athletic_trainer', 'nutritionist', 'physio', 'talent_scout']
const MEDICAL_ROLES = ['athletic_trainer', 'nutritionist', 'physio']
const CLUB_ADMIN_ROLES = ['coach', 'sporting_director', 'athletic_trainer', 'nutritionist', 'physio', 'talent_scout']

type HomeTabId = 'personal' | 'staff' | 'agent' | 'club' | 'studio'

const TAB_META: Record<HomeTabId, { title: string; subtitle: string }> = {
    personal: {
        title: 'In primo piano',
        subtitle: 'Le attività principali del tuo profilo',
    },
    staff: {
        title: 'Opportunità staff',
        subtitle: 'Contenuti e candidature per il tuo ruolo operativo',
    },
    agent: {
        title: 'Agent workspace',
        subtitle: 'Roster, mercato e attività di rappresentanza',
    },
    club: {
        title: 'Gestione società',
        subtitle: 'Controlla candidature, annunci e richieste ingresso',
    },
    studio: {
        title: 'Studio professionale',
        subtitle: 'Monitora la tua presenza e operatività studio',
    },
}

interface Props {
    userId: string
    userRole: string
    userName: string
}

export default function HomeClientDashboard({ userId, userRole, userName }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isClubAdmin, setIsClubAdmin] = useState(false)
    const [adminClubs, setAdminClubs] = useState<Array<{ id: string; name: string }>>([])
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<HomeTabId | null>(null)

    useEffect(() => {
        if (CLUB_ADMIN_ROLES.includes(userRole)) {
            checkClubAdmin(userId, userRole)
        } else {
            setLoading(false)
        }
    }, [userId, userRole])

    const checkClubAdmin = async (id: string, activeRole: string) => {
        try {
            if (!isClubAdminProfessionalRole(activeRole)) {
                setAdminClubs([])
                setIsClubAdmin(false)
                setSelectedClubId(null)
                return
            }

            const selectedClubStorageKey = getSelectedClubStorageKey(activeRole)
            const roleParam = encodeURIComponent(activeRole.toLowerCase())
            const res = await fetch(`/api/club-memberships?userId=${id}&professionalRoleId=${roleParam}`)
            if (res.ok) {
                const memberships = await res.json()
                const adminMemberships = memberships.filter((m: any) =>
                    membershipMatchesActiveProfessionalRole(m, activeRole) &&
                    (m.userId === id || m.userId === String(id)) && m.role === 'Admin' && m.isActive !== false
                )

                const clubs = adminMemberships.map((m: any) => ({
                    id: m.clubId?.toString(),
                    name: m.club?.name || `Club ${m.clubId}`,
                })).filter((c: any) => c.id)

                setAdminClubs(clubs)
                setIsClubAdmin(clubs.length > 0)

                const stored = typeof window !== 'undefined'
                    ? (localStorage.getItem(selectedClubStorageKey) || localStorage.getItem('selectedClubId'))
                    : null
                const fallbackId = stored && clubs.find((c: any) => c.id === stored) ? stored : (clubs[0]?.id || null)
                setSelectedClubId(fallbackId)
                if (fallbackId) {
                    localStorage.setItem(selectedClubStorageKey, fallbackId)
                    localStorage.setItem('selectedClubId', fallbackId)
                } else {
                    localStorage.removeItem(selectedClubStorageKey)
                }
            }
        } catch (error) {
            console.error('Error checking club admin:', error)
        } finally {
            setLoading(false)
        }
    }

    const isPlayer = PLAYER_ROLES.includes(userRole)
    const isCoach = COACH_ROLES.includes(userRole)
    const isAgent = AGENT_ROLES.includes(userRole)
    const isDS = DS_ROLES.includes(userRole)
    const isStaff = STAFF_ROLES.includes(userRole)
    const isMedical = MEDICAL_ROLES.includes(userRole)
    const selectedClubStorageKey = getSelectedClubStorageKey(userRole)
    const showClubAdminSection = (isClubAdmin || isDS) && CLUB_ADMIN_ROLES.includes(userRole)

    const tabs: Array<{ id: HomeTabId; label: string; visible: boolean }> = [
        { id: 'personal', label: 'Area personale', visible: isPlayer || isCoach || isDS },
        { id: 'staff', label: 'Opportunità', visible: isStaff },
        { id: 'agent', label: 'Agent', visible: isAgent },
        { id: 'club', label: 'Gestione società', visible: showClubAdminSection },
        { id: 'studio', label: 'Studio', visible: isMedical },
    ]

    const visibleTabs = tabs.filter((tab) => tab.visible)

    useEffect(() => {
        if (visibleTabs.length === 0) {
            setActiveTab(null)
            return
        }
        if (!activeTab || !visibleTabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id)
        }
    }, [activeTab, visibleTabs])

    if (loading) {
        return (
            <div className="min-h-screen glass-page-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen glass-page-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 glass-panel rounded-2xl p-6 md:p-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-base-content">
                        Ciao, {userName || 'Utente'}!
                    </h1>
                    <p className="glass-subtle-text mt-1">
                        Ecco cosa c'è di nuovo per te oggi
                    </p>
                </div>

                {visibleTabs.length > 1 && (
                    <div className="mb-8 flex flex-wrap gap-2 rounded-2xl glass-panel p-2">
                        {visibleTabs.map((tab) => {
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-secondary hover:text-base-content hover:bg-base-300/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {activeTab && (
                    <div className="mb-6 px-1">
                        <h2 className="text-xl md:text-2xl font-bold text-base-content">{TAB_META[activeTab].title}</h2>
                        <p className="glass-subtle-text text-sm md:text-base mt-1">{TAB_META[activeTab].subtitle}</p>
                    </div>
                )}

                {/* Sezione Personale (Player / Coach / DS) */}
                {(isPlayer || isCoach || isDS) && activeTab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <OpportunitiesForYouWidget userId={userId} userRole={userRole} />
                        <YourApplicationsWidget userId={userId} />
                        <YourClubWidget userId={userId} clubId={selectedClubId || undefined} professionalRoleId={userRole} />
                    </div>
                )}

                {/* Dashboard per Agent */}
                {isAgent && activeTab === 'agent' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RosterOverviewWidget userId={userId} />
                        <AgentMarketWidget userId={userId} />
                    </div>
                )}

                {/* Dashboard per Sporting Director / Club Admin */}
                {showClubAdminSection && activeTab === 'club' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-base-content">Club dashboard</h2>
                            {adminClubs.length > 1 && (
                                <select
                                    value={selectedClubId || ''}
                                    onChange={(e) => {
                                        const value = e.target.value || null
                                        setSelectedClubId(value)
                                        if (value) {
                                            localStorage.setItem(selectedClubStorageKey, value)
                                            localStorage.setItem('selectedClubId', value)
                                        }
                                    }}
                                    className="px-3 py-2 border border-base-300 rounded-lg text-sm bg-base-200/70 text-secondary shadow-sm"
                                >
                                    {adminClubs.map((club) => (
                                        <option key={club.id} value={club.id}>{club.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {adminClubs.length === 0 || !selectedClubId ? (
                            <div className="glass-widget rounded-2xl p-6 glass-subtle-text">
                                Nessuna società amministrata.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <YourClubWidget userId={userId} clubId={selectedClubId} professionalRoleId={userRole} />
                                <ReceivedApplicationsWidget userId={userId} clubId={selectedClubId} />
                                <MyAnnouncementsWidget userId={userId} clubId={selectedClubId} />
                                <ClubJoinRequestsWidget clubId={selectedClubId} />
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard per Staff (Athletic Trainer, Nutritionist, Physio, Talent Scout) */}
                {isStaff && activeTab === 'staff' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <OpportunitiesForYouWidget userId={userId} userRole={userRole} />
                        <YourApplicationsWidget userId={userId} />
                        <YourClubWidget userId={userId} professionalRoleId={userRole} />
                    </div>
                )}

                {/* Studio professionale per Fisioterapisti, Nutrizionisti, Preparatori Atletici */}
                {isMedical && activeTab === 'studio' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <YourStudioWidget userId={userId} />
                    </div>
                )}

                {/* Se l'utente non ha nessun ruolo specifico */}
                {!isPlayer && !isCoach && !isAgent && !showClubAdminSection && !isStaff && !isMedical && (
                    <div className="glass-widget rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-base-300/70 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-secondary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-base-content mb-2">
                            Completa il tuo profilo
                        </h3>
                        <p className="glass-subtle-text mb-4">
                            Imposta il tuo ruolo per vedere contenuti personalizzati
                        </p>
                        <button
                            onClick={() => router.push(`/profile/${userId}`)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-brand-700 transition-colors"
                        >
                            Vai al profilo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
