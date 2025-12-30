import fs from 'fs'
import path from 'path'
import ProfileSidebar from '@/components/profile-sidebar'
import ProfileSection from '@/components/profile-section'
import ProfileRepresentationWrapper from '@/components/profile-representation-wrapper'
import { BriefcaseIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')
const CLUBS_PATH = path.join(process.cwd(), 'data', 'clubs.json')
const CLUB_MEMBERSHIPS_PATH = path.join(process.cwd(), 'data', 'club-memberships.json')
const AFFILIATIONS_PATH = path.join(process.cwd(), 'data', 'affiliations.json')

function readJson(p: string) {
    if (!fs.existsSync(p)) return []
    try { return JSON.parse(fs.readFileSync(p, 'utf8') || '[]') } catch { return [] }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    const id = params.id
    const users = readJson(USERS_PATH)
    const follows = readJson(FOLLOWS_PATH)
    const clubs = readJson(CLUBS_PATH)
    const memberships = readJson(CLUB_MEMBERSHIPS_PATH)
    const affiliations = readJson(AFFILIATIONS_PATH)

    const user = users.find((u: any) => String(u.id) === id)
    if (!user) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-gray-900 text-xl">Utente non trovato</div>
        </div>
    )

    const followersCount = follows.filter((f: any) => String(f.followingId) === String(id)).length
    const followingCount = follows.filter((f: any) => String(f.followerId) === String(id)).length

    // Conteggio assistiti per agenti (affiliazioni accettate dove agentId = user.id)
    const assistatiCount = affiliations.filter((a: any) => String(a.agentId) === String(id) && a.status === 'accepted').length

    // Determina il club da mostrare
    let userClub = user.currentClub || null

    // Se Player: cerca il club dalla membership
    if (!userClub && user.professionalRole === 'Player') {
        const playerMembership = memberships.find((m: any) => String(m.userId) === String(id) && m.isActive)
        if (playerMembership) {
            const club = clubs.find((c: any) => String(c.id) === String(playerMembership.clubId))
            if (club) userClub = club.name
        }
    }

    // Se DS: cerca il club creato da lui
    if (!userClub && user.professionalRole === 'Sporting Director') {
        const managedClub = clubs.find((c: any) => String(c.createdBy) === String(id))
        if (managedClub) userClub = managedClub.name
    }

    // Esperienze formattate
    const experiences = Array.isArray(user.experiences) ? user.experiences : []
    const sports = Array.isArray(user.sports) && user.sports.length > 0 ? user.sports : (user.sport ? [user.sport] : [])
    const sportNorm = (sports[0] || user.sport || '').toString().toLowerCase()
    const isPlayerRole = (user.professionalRole || '').toString().toLowerCase().includes('player') || (user.professionalRole || '').toString().toLowerCase().includes('giocatore')

    return (
        <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Colonna Sinistra - Sidebar (Sticky per desktop) */}
                    <div className="lg:col-span-1 lg:sticky lg:top-8">
                        <ProfileSidebar
                            user={user}
                            clubName={userClub}
                            followersCount={followersCount}
                            followingCount={followingCount}
                            assistatiCount={assistatiCount}
                            isOwn={false}
                        />
                    </div>

                    {/* Colonna Destra - Contenuti (scrollabile) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bio e Competenze */}
                        <ProfileSection
                            title="Bio e Competenze"
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
                            const isStaff = ['Athletic Trainer', 'Nutritionist', 'Physio/Masseur'].includes(role)

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

                        {/* Esperienze / Carriera */}
                        <ProfileSection
                            title="Esperienze e Carriera"
                            subtitle="Percorso professionale"
                        >
                            {experiences.length > 0 ? (
                                <div className="space-y-4">
                                    {experiences.map((exp: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#2341F0]/40 shadow-sm transition"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <BriefcaseIcon className="w-5 h-5 text-[#2341F0]" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900">
                                                            {exp.role || exp.title || 'Ruolo'}
                                                        </h4>
                                                        {exp.team && (
                                                            <span className="text-gray-600 text-sm">
                                                                @ {exp.team}
                                                            </span>
                                                        )}
                                                        {exp.category && (
                                                            <span className="px-2 py-1 bg-[#eaf2ff] text-[#2341F0] text-xs rounded-full font-semibold">
                                                                {exp.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(exp.from || exp.to) && (
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {exp.from || '—'} - {exp.to || 'Presente'}
                                                        </p>
                                                    )}
                                                    {exp.summary && (
                                                        <p className="text-sm text-gray-700">
                                                            {exp.summary}
                                                        </p>
                                                    )}
                                                    {isPlayerRole && (() => {
                                                        const goals = typeof exp.goals === 'number' ? exp.goals : (exp.goals === '' ? undefined : Number(exp.goals))
                                                        const cleanSheets = typeof exp.cleanSheets === 'number' ? exp.cleanSheets : (exp.cleanSheets === '' ? undefined : Number(exp.cleanSheets))
                                                        const appearances = typeof exp.appearances === 'number' ? exp.appearances : (exp.appearances === '' ? undefined : Number(exp.appearances))
                                                        const pointsPerGame = typeof exp.pointsPerGame === 'number' ? exp.pointsPerGame : (exp.pointsPerGame === '' ? undefined : Number(exp.pointsPerGame))
                                                        const assists = typeof exp.assists === 'number' ? exp.assists : (exp.assists === '' ? undefined : Number(exp.assists))
                                                        const rebounds = typeof exp.rebounds === 'number' ? exp.rebounds : (exp.rebounds === '' ? undefined : Number(exp.rebounds))
                                                        const volleyAces = typeof exp.volleyAces === 'number' ? exp.volleyAces : (exp.volleyAces === '' ? undefined : Number(exp.volleyAces))
                                                        const volleyBlocks = typeof exp.volleyBlocks === 'number' ? exp.volleyBlocks : (exp.volleyBlocks === '' ? undefined : Number(exp.volleyBlocks))
                                                        const volleyDigs = typeof exp.volleyDigs === 'number' ? exp.volleyDigs : (exp.volleyDigs === '' ? undefined : Number(exp.volleyDigs))

                                                        const hasAny = [goals, cleanSheets, appearances, pointsPerGame, assists, rebounds, volleyAces, volleyBlocks, volleyDigs]
                                                            .some(v => v !== null && v !== undefined && !Number.isNaN(v))
                                                        if (!hasAny) return null

                                                        const isFootball = sportNorm === 'calcio'
                                                        const isBasket = sportNorm === 'basket'
                                                        const isVolley = sportNorm === 'pallavolo'

                                                        return (
                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                                {isFootball && goals != null && !Number.isNaN(goals) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Gol: {goals}</span>
                                                                )}
                                                                {isFootball && cleanSheets != null && !Number.isNaN(cleanSheets) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Clean sheet: {cleanSheets}</span>
                                                                )}
                                                                {isBasket && pointsPerGame != null && !Number.isNaN(pointsPerGame) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">PPG: {pointsPerGame}</span>
                                                                )}
                                                                {isBasket && assists != null && !Number.isNaN(assists) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Assist: {assists}</span>
                                                                )}
                                                                {isBasket && rebounds != null && !Number.isNaN(rebounds) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Rimbalzi: {rebounds}</span>
                                                                )}
                                                                {isVolley && volleyAces != null && !Number.isNaN(volleyAces) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Ace: {volleyAces}</span>
                                                                )}
                                                                {isVolley && volleyBlocks != null && !Number.isNaN(volleyBlocks) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Muri: {volleyBlocks}</span>
                                                                )}
                                                                {isVolley && volleyDigs != null && !Number.isNaN(volleyDigs) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Difese: {volleyDigs}</span>
                                                                )}
                                                                {appearances != null && !Number.isNaN(appearances) && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Presenze: {appearances}</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Nessuna esperienza inserita</p>
                            )}
                        </ProfileSection>

                        {/* Relazioni (Rappresentazioni per Players) */}
                        {user.professionalRole === 'Player' && (
                            <ProfileSection
                                title="Relazioni"
                                subtitle="Agenti e affiliazioni"
                            >
                                <ProfileRepresentationWrapper
                                    profileUserId={Number(id)}
                                    profileUserRole={user.professionalRole}
                                />
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
