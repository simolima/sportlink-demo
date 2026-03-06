"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProfileSidebar from '@/components/profile-sidebar'
import ProfileSection from '@/components/profile-section'
import ProfileRepresentationWrapper from '@/components/profile-representation-wrapper'
import SelfEvaluationDisplay from '@/components/self-evaluation-display'
import SocialLinks from '@/components/social-links'
import ExperienceCard from '@/components/experience-card'
import { SparklesIcon, XMarkIcon, ChevronRightIcon, BuildingOffice2Icon, MapPinIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-browser'
import BookVisitButton from '@/components/booking/BookVisitButton'
import { PROFESSIONAL_ROLES } from '@/lib/types'

export default function ProfilePage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-900 text-xl">Caricamento...</div>
            </div>
        }>
            <ProfilePageContent params={params} />
        </Suspense>
    )
}

function ProfilePageContent({ params }: { params: { id: string } }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const rawViewRole = searchParams.get('viewRole')
    // Sanitizza viewRole: accetta solo ruoli validi
    const viewRole = rawViewRole && (PROFESSIONAL_ROLES as readonly string[]).includes(rawViewRole) ? rawViewRole : null
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [assistatiCount, setAssistatiCount] = useState(0)
    const [verificationsCount, setVerificationsCount] = useState(0)
    const [favoritesCount, setFavoritesCount] = useState(0)
    const [userClub, setUserClub] = useState<string | null>(null)
    const [sports, setSports] = useState<string[]>([])
    const [showCareerModal, setShowCareerModal] = useState(false)
    const [studioData, setStudioData] = useState<any>(null)
    const [loggedUserId, setLoggedUserId] = useState<string | null>(null)
    const [profileRoles, setProfileRoles] = useState<Array<{ role_id: string; is_primary: boolean; sport_name?: string | null }>>([])
    const [activeViewRole, setActiveViewRole] = useState<string>('')
    useEffect(() => {
        const currentUserId = localStorage.getItem('currentUserId')
        const activeRole = localStorage.getItem('currentUserRole') || ''
        setLoggedUserId(currentUserId)
        const isOwnProfile = currentUserId === params.id

        // Se c'è un viewRole esplicito in URL, usalo sempre.
        // Altrimenti, per il proprio profilo usa il ruolo attivo da localStorage.
        // Per profili altrui, lascia vuoto (sarà risolto al primario sotto).
        const roleForView = viewRole || (isOwnProfile ? activeRole : '')

        const fetchProfile = async () => {
            setLoading(true)
            try {
                // Fetch user roles (sempre, per mostrare i bottoni di switch)
                const rolesRes = await fetch(`/api/users/roles?userId=${params.id}`)
                const rolesData: Array<{ role_id: string; is_primary: boolean; sport_name?: string | null }> = rolesRes.ok ? await rolesRes.json() : []
                setProfileRoles(rolesData)

                // Determina il ruolo da visualizzare
                let effectiveViewRole = roleForView
                if (!isOwnProfile && !viewRole && rolesData.length > 0) {
                    // Default: ruolo primario, o il primo disponibile
                    const primary = rolesData.find(r => r.is_primary)
                    effectiveViewRole = primary?.role_id || rolesData[0].role_id
                }
                setActiveViewRole(effectiveViewRole)

                // Fetch user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (profileError || !profile) {
                    console.error('Profile fetch error:', profileError)
                    setLoading(false)
                    return
                }

                // Fetch user sports — filter by active role when viewing own profile
                let sportsQuery = supabase
                    .from('profile_sports')
                    .select('sport_id, is_main_sport, role_id, lookup_sports(name)')
                    .eq('user_id', params.id)
                    .is('deleted_at', null)

                // Filtra sport per il ruolo visualizzato (proprio o altrui)
                if (effectiveViewRole) {
                    sportsQuery = sportsQuery.eq('role_id', effectiveViewRole)
                }

                const { data: userSports } = await sportsQuery
                const sportsNames = userSports?.map((ps: any) => ps.lookup_sports?.name).filter(Boolean) || []
                setSports(sportsNames)

                // Fetch physical stats
                const { data: physicalStats } = await supabase
                    .from('physical_stats')
                    .select('*')
                    .eq('user_id', params.id)
                    .single()

                // Construct user object
                const userData = {
                    id: profile.id,
                    email: profile.email,
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    username: profile.username,
                    bio: profile.bio,
                    avatarUrl: profile.avatar_url,
                    coverUrl: profile.cover_url,
                    city: profile.city,
                    country: profile.country,
                    birthDate: profile.birth_date,
                    gender: profile.gender,
                    professionalRole: (() => {
                        // Usa il ruolo della vista corrente
                        const role = effectiveViewRole || profile.role_id
                        if (!role) return null
                        return role.charAt(0).toUpperCase() + role.slice(1)
                    })(),
                    sports: sportsNames,
                    height: physicalStats?.height_cm || null,
                    weight: physicalStats?.weight_kg || null,
                    dominantFoot: physicalStats?.dominant_foot || null,
                    dominantHand: physicalStats?.dominant_hand || null,
                    socialLinks: profile.social_links || {},
                    playerSelfEvaluation: profile.player_self_evaluation || null,
                    coachSelfEvaluation: profile.coach_self_evaluation || null,
                    contractStatus: profile.contract_status || null,
                    contractEndDate: profile.contract_end_date || null,
                    experiences: [], // populated below
                }

                // Fetch career experiences (filtra per ruolo attivo se presente)
                const expRes = await fetch(`/api/career-experiences?userId=${params.id}`)
                if (expRes.ok) {
                    const rawExps = await expRes.json()
                    const allExps = (rawExps || []).map((exp: any) => ({
                        id: exp.id,
                        team: exp.organization?.name || '',
                        role: exp.role || '',
                        roleDetail: exp.role_detail || '',
                        profileType: exp.profile_type || '',
                        experienceKind: exp.experience_kind || '',
                        category: exp.category || '',
                        categoryTier: exp.category_tier || '',
                        competitionType: exp.competition_type || '',
                        season: exp.season || '',
                        from: exp.start_date || '',
                        to: exp.end_date || '',
                        isCurrentlyPlaying: exp.is_current || false,
                        employmentType: exp.employment_type || '',
                        description: exp.description || '',
                        organizationCity: exp.organization?.city || '',
                        organizationCountry: exp.organization?.country || '',
                        sportName: exp.organization?.sport || exp.organization?.lookup_sports?.name || '',
                        positionName: exp.position?.name || '',
                        positionCategory: exp.position?.category || '',
                        // Football stats
                        goals: exp.goals ?? undefined,
                        assists: exp.assists ?? undefined,
                        cleanSheets: exp.clean_sheets ?? undefined,
                        appearances: exp.appearances ?? undefined,
                        minutesPlayed: exp.minutes_played ?? undefined,
                        penalties: exp.penalties ?? undefined,
                        yellowCards: exp.yellow_cards ?? undefined,
                        redCards: exp.red_cards ?? undefined,
                        substitutionsIn: exp.substitutions_in ?? undefined,
                        substitutionsOut: exp.substitutions_out ?? undefined,
                        // Basketball stats
                        gamesPlayed: exp.games_played ?? undefined,
                        pointsPerGame: exp.points_per_game ?? undefined,
                        rebounds: exp.rebounds ?? undefined,
                        // Volleyball stats
                        matchesPlayed: exp.matches_played ?? undefined,
                        volleyAces: exp.aces ?? undefined,
                        volleyBlocks: exp.blocks ?? undefined,
                        volleyDigs: exp.digs ?? undefined,
                        // Coach stats
                        matchesCoached: exp.matches_coached ?? undefined,
                        wins: exp.wins ?? undefined,
                        draws: exp.draws ?? undefined,
                        losses: exp.losses ?? undefined,
                        trophies: exp.trophies ?? undefined,
                    }))
                    // Filtra le esperienze per il ruolo visualizzato
                    userData.experiences = effectiveViewRole
                        ? allExps.filter((e: any) => e.profileType === effectiveViewRole)
                        : allExps
                }

                console.log('🔍 Profile Data Loaded:', {
                    socialLinks: userData.socialLinks,
                    playerSelfEvaluation: userData.playerSelfEvaluation,
                    coachSelfEvaluation: userData.coachSelfEvaluation,
                    hasSocialLinks: userData.socialLinks && Object.values(userData.socialLinks).some((link: any) => link?.trim && link.trim()),
                    hasPlayerEval: !!userData.playerSelfEvaluation,
                    hasCoachEval: !!userData.coachSelfEvaluation
                })

                setUser(userData)

                // Fetch followers/following counts
                const { count: followersC } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', params.id)

                const { count: followingC } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', params.id)

                setFollowersCount(followersC || 0)
                setFollowingCount(followingC || 0)

                // Fetch assistiti count (for agents)
                const { count: assistatiC } = await supabase
                    .from('affiliations')
                    .select('*', { count: 'exact', head: true })
                    .eq('agent_id', params.id)
                    .eq('status', 'active')

                setAssistatiCount(assistatiC || 0)

                // Fetch verifications count
                const { count: verificationsC } = await supabase
                    .from('verifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('verified_id', params.id)

                setVerificationsCount(verificationsC || 0)

                // Fetch favorites count
                const { count: favoritesC } = await supabase
                    .from('favorites')
                    .select('*', { count: 'exact', head: true })
                    .eq('favorite_id', params.id)

                setFavoritesCount(favoritesC || 0)

                // Fetch club info (TODO: implement club membership query)
                // For now, leaving as null

                // Fetch studio data (for physio, nutritionist, etc.)
                const { data: studio } = await supabase
                    .from('professional_studios')
                    .select('*')
                    .eq('owner_id', params.id)
                    .is('deleted_at', null)
                    .maybeSingle()

                if (studio) setStudioData(studio)
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [params.id, viewRole])

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-900 text-xl">Caricamento...</div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-900 text-xl">Utente non trovato</div>
            </div>
        )
    }

    const experiences = Array.isArray(user.experiences) ? user.experiences : []

    return (
        <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Colonna Sinistra - Sidebar (Sticky per desktop) */}
                    <div className="lg:col-span-1 lg:sticky lg:top-8">
                        <ProfileSidebar
                            user={user}
                            clubName={userClub}
                            verificationsCount={verificationsCount}
                            favoritesCount={favoritesCount}
                            followersCount={followersCount}
                            followingCount={followingCount}
                            assistatiCount={assistatiCount}
                            isOwn={false}
                            profileRoles={profileRoles}
                            activeViewRole={activeViewRole}
                        />
                    </div>

                    {/* Colonna Destra - Contenuti (scrollabile) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profilo */}
                        <ProfileSection
                            title="Profilo"
                            subtitle="Descrizione e abilità principali"
                        >
                            {user.bio ? (
                                <p className="text-gray-800 leading-relaxed mb-4">
                                    {user.bio.slice(0, 500)}
                                </p>
                            ) : (
                                <p className="text-gray-600 italic">Nessuna bio inserita</p>
                            )}

                            {/* Sport/Skills */}
                            {sports.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">Sport</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sports.map((sport: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-[#eaf2ff] text-[#2341F0] rounded-full text-sm font-semibold border border-[#2341F0]/30"
                                            >
                                                {sport}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ProfileSection>

                        {/* Qualifiche */}
                        {(() => {
                            const role = (user.professionalRole || '').toString()
                            const isCoach = role === 'Coach'
                            const isAgent = role === 'Agent'
                            const isStaff = ['Athletic Trainer', 'Nutritionist', 'Physio/Masseur', 'Talent Scout'].includes(role)

                            if (!isCoach && !isAgent && !isStaff) return null

                            return (
                                <ProfileSection
                                    title="Qualifiche"
                                    subtitle="Licenze, abilitazioni e certificazioni"
                                >
                                    {isCoach && (() => {
                                        const licenses = Array.isArray(user?.uefaLicenses) ? user.uefaLicenses : []
                                        const hasLicenses = licenses.length > 0
                                        return (
                                            <div className="mt-1">
                                                {!hasLicenses && !user?.coachSpecializations && (
                                                    <p className="text-sm text-gray-600">Nessuna qualifica inserita.</p>
                                                )}
                                                {hasLicenses && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {licenses.map((lic: string) => (
                                                            <span key={lic} className="text-xs rounded-full bg-gray-100 text-gray-800 px-2 py-1 font-semibold border border-gray-200">{lic}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {user?.coachSpecializations && (
                                                    <p className="mt-2 text-sm text-gray-700">{user.coachSpecializations}</p>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {isAgent && (() => {
                                        const hasLicense = !!user?.hasFifaLicense
                                        return (
                                            <div className="mt-1 space-y-1 text-sm text-gray-700">
                                                <p>Licenza FIFA: {hasLicense ? 'Sì' : 'No'}</p>
                                                {hasLicense && user?.fifaLicenseNumber && (
                                                    <p>Numero licenza: {user.fifaLicenseNumber}</p>
                                                )}
                                                {user?.agentNotes && (
                                                    <p className="text-gray-700">{user.agentNotes}</p>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {isStaff && (() => {
                                        const certs = Array.isArray(user?.certifications) ? user.certifications : []
                                        return (
                                            <div className="mt-1">
                                                {certs.length === 0 ? (
                                                    <p className="text-sm text-gray-600">Nessuna certificazione inserita.</p>
                                                ) : (
                                                    <div className="mt-2 space-y-2">
                                                        {certs.map((c: any, idx: number) => (
                                                            <div key={`${c.name}-${idx}`} className="rounded-lg bg-white p-3 shadow-sm border border-gray-200">
                                                                <p className="text-sm font-semibold text-gray-900">{c.name || 'Certificazione'}</p>
                                                                <p className="text-xs text-gray-600">{[c.issuingOrganization, c.yearObtained].filter(Boolean).join(' • ')}</p>
                                                                {c.expiryDate && (
                                                                    <p className="text-xs text-gray-600">Scadenza: {c.expiryDate}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </ProfileSection>
                            )
                        })()}

                        {/* Carriera */}
                        <ProfileSection
                            title="Carriera"
                            subtitle="Percorso professionale"
                        >
                            {experiences.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Show only the latest experience (first in array, ordered by start_date DESC) */}
                                    <ExperienceCard
                                        key={experiences[0].id}
                                        exp={experiences[0]}
                                        sportName={sports[0] || ''}
                                    />

                                    {/* Button to open full career modal */}
                                    {experiences.length > 1 && (
                                        <button
                                            onClick={() => setShowCareerModal(true)}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[#2341F0]/30 text-[#2341F0] hover:bg-[#eaf2ff] hover:border-[#2341F0]/50 transition-all duration-200 text-sm font-semibold group"
                                        >
                                            <span>Visualizza tutta la carriera</span>
                                            <span className="text-xs text-gray-400 font-normal">({experiences.length} esperienze)</span>
                                            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Nessuna esperienza inserita</p>
                            )}
                        </ProfileSection>

                        {/* Career Modal (Full career view) */}
                        {showCareerModal && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                onClick={() => setShowCareerModal(false)}
                            >
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                                {/* Modal */}
                                <div
                                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#2341F0]/5 to-transparent flex-shrink-0">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Carriera completa</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {experiences.length} esperienza{experiences.length !== 1 ? 'e' : ''} · {user?.firstName} {user?.lastName}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowCareerModal(false)}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Scrollable content */}
                                    <div className="overflow-y-auto flex-1 px-6 py-4">
                                        <div className="relative">
                                            {/* Timeline line */}
                                            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200 hidden sm:block" />

                                            <div className="space-y-4">
                                                {experiences.map((exp: any, idx: number) => (
                                                    <div key={exp.id} className="relative sm:pl-10">
                                                        {/* Timeline dot */}
                                                        <div className={`absolute left-2.5 top-5 w-3 h-3 rounded-full border-2 border-white shadow-sm hidden sm:block ${idx === 0 ? 'bg-[#2341F0]' : 'bg-gray-300'
                                                            }`} />
                                                        <ExperienceCard
                                                            exp={exp}
                                                            sportName={sports[0] || ''}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                                        <button
                                            onClick={() => setShowCareerModal(false)}
                                            className="w-full py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                                        >
                                            Chiudi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Relazioni (Rappresentazioni per Players) */}
                        {user.professionalRole?.toLowerCase() === 'player' && (
                            <ProfileSection
                                title="Relazioni"
                                subtitle="Agenti e affiliazioni"
                            >
                                <ProfileRepresentationWrapper
                                    profileUserId={params.id}
                                    profileUserRole={user.professionalRole}
                                />
                            </ProfileSection>
                        )}

                        {/* Social Links */}
                        {user?.socialLinks && Object.values(user.socialLinks).some((link: any) => link?.trim && link.trim()) && (
                            <ProfileSection
                                title="Link Sociali"
                                subtitle="Profili e collegamenti esterni"
                            >
                                <SocialLinks socialLinks={user.socialLinks} showLabels={true} />
                            </ProfileSection>
                        )}

                        {/* Self Evaluation */}
                        {(user?.playerSelfEvaluation || user?.coachSelfEvaluation) && (
                            <ProfileSection
                                title="Autovalutazione"
                                subtitle="Valutazione delle competenze"
                            >
                                <SelfEvaluationDisplay
                                    user={user}
                                    playerSelfEvaluation={user.playerSelfEvaluation}
                                    coachSelfEvaluation={user.coachSelfEvaluation}
                                    professionalRole={user.professionalRole}
                                    sports={sports}
                                />
                            </ProfileSection>
                        )}

                        {/* Lo Studio */}
                        {studioData && (
                            <ProfileSection
                                title="Lo Studio"
                                subtitle="Sede e servizi"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-gray-900 font-semibold">{studioData.name}</p>
                                    </div>

                                    {studioData.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-gray-700 text-sm">{studioData.address}</p>
                                        </div>
                                    )}

                                    {Array.isArray(studioData.services_offered) && studioData.services_offered.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Servizi offerti</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {studioData.services_offered.map((service: string, idx: number) => (
                                                    <span key={idx} className="badge badge-outline badge-sm">{service}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {loggedUserId && loggedUserId !== params.id && (
                                        <BookVisitButton
                                            studioId={studioData.id}
                                            professionalId={params.id}
                                            services={studioData.services_offered || []}
                                            clientProfileId={loggedUserId}
                                        />
                                    )}
                                </div>
                            </ProfileSection>
                        )}

                        {/* Statistiche & Highlights - Placeholder */}
                        <ProfileSection
                            title="Statistiche & Highlights"
                            subtitle="Grafici e video prestazioni"
                        >
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <SparklesIcon className="w-16 h-16 text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg font-semibold">Prossimamente...</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Qui saranno disponibili grafici delle prestazioni e video highlights
                                </p>
                            </div>
                        </ProfileSection>
                    </div>
                </div>
            </div>
        </div>
    )
}
