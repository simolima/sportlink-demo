'use client'

import {
    BriefcaseIcon,
    CalendarDaysIcon,
    MapPinIcon,
    TrophyIcon,
    ClockIcon,
} from '@heroicons/react/24/outline'

/* ───────────────────── Types ───────────────────── */
interface ExperienceData {
    id: string
    team: string
    role: string
    roleDetail?: string
    profileType?: string          // 'player' | 'coach' | 'agent' | 'sporting_director' | ...
    experienceKind?: string       // 'club' | 'national_team' | 'academy' | ...
    category?: string
    categoryTier?: string
    competitionType?: string      // 'male' | 'female' | 'open' | 'mixed'
    season?: string
    from?: string
    to?: string
    isCurrentlyPlaying?: boolean
    employmentType?: string       // 'owned' | 'loan' | 'free_agent' | ...
    description?: string
    organizationCity?: string
    organizationCountry?: string
    sportName?: string
    positionName?: string
    positionCategory?: string
    // Football stats
    goals?: number | null
    assists?: number | null
    cleanSheets?: number | null
    appearances?: number | null
    minutesPlayed?: number | null
    penalties?: number | null
    yellowCards?: number | null
    redCards?: number | null
    substitutionsIn?: number | null
    substitutionsOut?: number | null
    // Basketball stats
    gamesPlayed?: number | null
    pointsPerGame?: number | null
    rebounds?: number | null
    // Volleyball stats
    matchesPlayed?: number | null
    volleyAces?: number | null
    volleyBlocks?: number | null
    volleyDigs?: number | null
    // Coach stats
    matchesCoached?: number | null
    wins?: number | null
    draws?: number | null
    losses?: number | null
    trophies?: number | null
}

interface ExperienceCardProps {
    exp: ExperienceData
    sportName?: string        // user's main sport (fallback)
    showStats?: boolean       // default true
}

/* ───────────────────── Helpers ───────────────────── */

function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    try {
        return new Date(dateStr).toLocaleDateString('it-IT', {
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return dateStr
    }
}

function buildPeriodLabel(exp: ExperienceData): string {
    if (exp.season?.trim()) {
        let label = exp.season
        if (exp.from) {
            const from = formatDate(exp.from)
            const to = exp.isCurrentlyPlaying ? 'Presente' : formatDate(exp.to)
            label += ` (${from} – ${to || 'Presente'})`
        }
        return label
    }
    if (exp.from || exp.to) {
        const from = formatDate(exp.from) || '—'
        const to = exp.isCurrentlyPlaying ? 'Presente' : formatDate(exp.to) || 'Presente'
        return `${from} – ${to}`
    }
    return ''
}

function experienceKindLabel(kind?: string): string | null {
    const map: Record<string, string> = {
        club: 'Club',
        national_team: 'Nazionale',
        academy: 'Accademia',
        federation: 'Federazione',
        private_practice: 'Libero professionista',
        other: 'Altro',
    }
    return kind ? (map[kind] ?? null) : null
}

function employmentLabel(type?: string): string | null {
    const map: Record<string, string> = {
        owned: 'Titolare',
        loan: 'Prestito',
        free_agent: 'Svincolato',
        tryout: 'In prova',
        other: 'Altro',
    }
    return type ? (map[type] ?? null) : null
}

function competitionTypeLabel(type?: string): string | null {
    const map: Record<string, string> = {
        male: 'Maschile',
        female: 'Femminile',
        open: 'Open',
        mixed: 'Misto',
    }
    return type ? (map[type] ?? null) : null
}

function isVal(v: unknown): v is number {
    return typeof v === 'number' && !Number.isNaN(v)
}

/* ───────────────────── Stat badge ───────────────────── */

function StatBadge({ label, value, icon }: { label: string; value: number | string; icon?: string }) {
    return (
        <div className="flex flex-col items-center bg-gray-50 rounded-lg px-3 py-2 min-w-[60px]">
            {icon && <span className="text-sm mb-0.5">{icon}</span>}
            <span className="text-base font-bold text-gray-900">{value}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium leading-tight text-center">{label}</span>
        </div>
    )
}

/* ───────────────────── Stat sections by type ───────────────────── */

function FootballStats({ exp }: { exp: ExperienceData }) {
    const stats: { label: string; value: number; icon?: string }[] = []

    if (isVal(exp.appearances)) stats.push({ label: 'Presenze', value: exp.appearances, icon: '👕' })
    if (isVal(exp.goals)) stats.push({ label: 'Gol', value: exp.goals, icon: '⚽' })
    if (isVal(exp.assists)) stats.push({ label: 'Assist', value: exp.assists, icon: '🅰️' })
    if (isVal(exp.cleanSheets)) stats.push({ label: 'Clean sheet', value: exp.cleanSheets, icon: '🧤' })
    if (isVal(exp.minutesPlayed)) stats.push({ label: 'Minuti', value: exp.minutesPlayed, icon: '⏱️' })
    if (isVal(exp.penalties)) stats.push({ label: 'Rigori', value: exp.penalties, icon: '🎯' })
    if (isVal(exp.yellowCards)) stats.push({ label: 'Ammonizioni', value: exp.yellowCards, icon: '🟡' })
    if (isVal(exp.redCards)) stats.push({ label: 'Espulsioni', value: exp.redCards, icon: '🔴' })
    if (isVal(exp.substitutionsIn)) stats.push({ label: 'Subentri', value: exp.substitutionsIn, icon: '🔼' })
    if (isVal(exp.substitutionsOut)) stats.push({ label: 'Sostituzioni', value: exp.substitutionsOut, icon: '🔽' })

    if (stats.length === 0) return null
    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Statistiche</p>
            <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                    <StatBadge key={s.label} label={s.label} value={s.value} icon={s.icon} />
                ))}
            </div>
        </div>
    )
}

function BasketballStats({ exp }: { exp: ExperienceData }) {
    const stats: { label: string; value: number; icon?: string }[] = []

    if (isVal(exp.gamesPlayed)) stats.push({ label: 'Partite', value: exp.gamesPlayed, icon: '🏀' })
    if (isVal(exp.appearances)) stats.push({ label: 'Presenze', value: exp.appearances, icon: '👕' })
    if (isVal(exp.pointsPerGame)) stats.push({ label: 'PPG', value: exp.pointsPerGame, icon: '🎯' })
    if (isVal(exp.rebounds)) stats.push({ label: 'Rimbalzi', value: exp.rebounds, icon: '🔄' })
    if (isVal(exp.minutesPlayed)) stats.push({ label: 'Minuti', value: exp.minutesPlayed, icon: '⏱️' })

    if (stats.length === 0) return null
    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Statistiche</p>
            <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                    <StatBadge key={s.label} label={s.label} value={s.value} icon={s.icon} />
                ))}
            </div>
        </div>
    )
}

function VolleyballStats({ exp }: { exp: ExperienceData }) {
    const stats: { label: string; value: number; icon?: string }[] = []

    if (isVal(exp.matchesPlayed)) stats.push({ label: 'Partite', value: exp.matchesPlayed, icon: '🏐' })
    if (isVal(exp.volleyAces)) stats.push({ label: 'Ace', value: exp.volleyAces, icon: '💨' })
    if (isVal(exp.volleyBlocks)) stats.push({ label: 'Muri', value: exp.volleyBlocks, icon: '🧱' })
    if (isVal(exp.volleyDigs)) stats.push({ label: 'Difese', value: exp.volleyDigs, icon: '🛡️' })

    if (stats.length === 0) return null
    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Statistiche</p>
            <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                    <StatBadge key={s.label} label={s.label} value={s.value} icon={s.icon} />
                ))}
            </div>
        </div>
    )
}

function CoachStats({ exp }: { exp: ExperienceData }) {
    const stats: { label: string; value: number | string; icon?: string }[] = []

    if (isVal(exp.matchesCoached)) stats.push({ label: 'Partite', value: exp.matchesCoached, icon: '📋' })
    if (isVal(exp.wins)) stats.push({ label: 'Vittorie', value: exp.wins, icon: '✅' })
    if (isVal(exp.draws)) stats.push({ label: 'Pareggi', value: exp.draws, icon: '➖' })
    if (isVal(exp.losses)) stats.push({ label: 'Sconfitte', value: exp.losses, icon: '❌' })
    if (isVal(exp.trophies)) stats.push({ label: 'Trofei', value: exp.trophies, icon: '🏆' })

    // Win rate
    if (isVal(exp.matchesCoached) && exp.matchesCoached > 0 && isVal(exp.wins)) {
        const winRate = Math.round((exp.wins / exp.matchesCoached) * 100)
        stats.push({ label: '% Vittorie', value: `${winRate}%`, icon: '📊' })
    }

    if (stats.length === 0) return null
    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Statistiche</p>
            <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                    <StatBadge key={s.label} label={s.label} value={s.value} icon={s.icon} />
                ))}
            </div>
        </div>
    )
}

/* ───────────────────── MAIN COMPONENT ───────────────────── */

export default function ExperienceCard({ exp, sportName, showStats = true }: ExperienceCardProps) {
    const period = buildPeriodLabel(exp)
    const kindLabel = experienceKindLabel(exp.experienceKind)
    const emplLabel = employmentLabel(exp.employmentType)
    const compLabel = competitionTypeLabel(exp.competitionType)
    const location = [exp.organizationCity, exp.organizationCountry].filter(Boolean).join(', ')

    // Determine sport from experience or from user's main sport
    const sport = (exp.sportName || sportName || '').toLowerCase()
    const isFootball = sport.includes('calcio') || sport.includes('football') || sport.includes('soccer') || sport === ''
    const isBasket = sport.includes('basket') || sport.includes('pallacanestro')
    const isVolley = sport.includes('volley') || sport.includes('pallavolo')

    const profileType = (exp.profileType || '').toLowerCase()
    const isCoach = profileType === 'coach'
    const isPlayer = profileType === 'player' || profileType === ''

    // Profile type display label
    const profileLabel = (() => {
        if (isCoach) return 'Allenatore'
        if (profileType === 'agent') return 'Agente'
        if (profileType === 'sporting_director') return 'Direttore Sportivo'
        if (profileType === 'athletic_trainer') return 'Preparatore Atletico'
        if (profileType === 'nutritionist') return 'Nutrizionista'
        if (profileType === 'physio') return 'Fisioterapista'
        return null // player — shown via position
    })()

    return (
        <div className="bg-white rounded-xl border border-gray-200 hover:border-[#2341F0]/30 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#2341F0] to-[#5B7BF0]" />

            <div className="p-4 sm:p-5">
                {/* Header row */}
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#eaf2ff] flex items-center justify-center">
                        {isCoach ? (
                            <span className="text-lg">🧑‍🏫</span>
                        ) : profileType === 'agent' ? (
                            <span className="text-lg">🤝</span>
                        ) : profileType === 'sporting_director' ? (
                            <span className="text-lg">📊</span>
                        ) : (
                            <BriefcaseIcon className="w-5 h-5 text-[#2341F0]" />
                        )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                        {/* Title line */}
                        <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-[15px] leading-tight">
                                {exp.roleDetail || exp.role || profileLabel || 'Esperienza'}
                            </h4>
                            {exp.isCurrentlyPlaying && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Attuale
                                </span>
                            )}
                        </div>

                        {/* Team name */}
                        {exp.team && (
                            <p className="text-sm text-gray-700 font-medium mt-0.5">
                                {exp.team}
                            </p>
                        )}

                        {/* Meta row: period, location, position */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                            {period && (
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    {period}
                                </span>
                            )}
                            {location && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPinIcon className="w-3.5 h-3.5" />
                                    {location}
                                </span>
                            )}
                            {exp.positionName && (
                                <span className="inline-flex items-center gap-1">
                                    <span className="text-[10px]">📌</span>
                                    {exp.positionName}
                                    {exp.positionCategory && (
                                        <span className="text-gray-400">({exp.positionCategory})</span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Tags row */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {exp.category && (
                                <span className="px-2 py-0.5 bg-[#eaf2ff] text-[#2341F0] text-[11px] rounded-full font-semibold border border-[#2341F0]/20">
                                    {exp.category}
                                </span>
                            )}
                            {exp.categoryTier && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full font-medium">
                                    {exp.categoryTier}
                                </span>
                            )}
                            {kindLabel && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] rounded-full font-medium border border-purple-200">
                                    {kindLabel}
                                </span>
                            )}
                            {emplLabel && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] rounded-full font-medium border border-amber-200">
                                    {emplLabel}
                                </span>
                            )}
                            {compLabel && (
                                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[11px] rounded-full font-medium border border-sky-200">
                                    {compLabel}
                                </span>
                            )}
                            {profileLabel && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded-full font-medium border border-indigo-200">
                                    {profileLabel}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {exp.description && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {exp.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats section (sport-aware) */}
                {showStats && isPlayer && isFootball && <FootballStats exp={exp} />}
                {showStats && isPlayer && isBasket && <BasketballStats exp={exp} />}
                {showStats && isPlayer && isVolley && <VolleyballStats exp={exp} />}
                {showStats && isCoach && <CoachStats exp={exp} />}
            </div>
        </div>
    )
}
