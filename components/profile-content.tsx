'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDaysIcon, EnvelopeIcon, MapPinIcon, PencilSquareIcon, UserIcon, BriefcaseIcon, TrophyIcon } from '@heroicons/react/24/outline'
import ProfileTabs from './profile-tabs'
import SelfEvaluationDisplay from './self-evaluation-display'

/* ─── Sport → emoji mapping ─── */
const sportEmoji: Record<string, string> = {
    calcio: '⚽', basket: '🏀', pallavolo: '🏐', tennis: '🎾',
    nuoto: '🏊', atletica: '🏃', rugby: '🏉', ciclismo: '🚴',
}
function getSportIcon(sport?: string) {
    if (!sport) return '🏅'
    return sportEmoji[sport.toLowerCase()] || '🏅'
}

type TabType = 'informazioni' | 'autovalutazione'

interface InfoItem {
    label: string
    value?: string | number
    icon?: React.ReactNode
}

const formatDate = (value?: string) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('it-IT')
}

const buildRoleDetails = (user: any, sports: string[]): InfoItem[] => {
    const role = (user?.professionalRole || '').toLowerCase();
    const availability = user?.availability ? user.availability : 'Non specificato';
    const level = user?.level ? user.level : 'Non specificato';
    const sportLabel = sports.length ? sports.join(', ') : (user?.sport || 'Non specificato');

    // Player + Calcio + campi calcio
    const isFootballPlayer =
        (role.includes('player') || role.includes('giocatore')) &&
        Array.isArray(sports) && sports.includes('Calcio') &&
        (user?.footballPrimaryPosition || user?.footballSecondaryPosition);

    if (isFootballPlayer) {
        return [
            { label: 'Sport', value: sportLabel },
            { label: 'Ruolo (Calcio)', value: user.footballPrimaryPosition || 'Non specificato' },
            { label: 'Dettaglio ruolo', value: user.footballSecondaryPosition || 'Non specificato' },
            { label: 'Livello / categoria', value: level },
            { label: 'Piede', value: user?.dominantFoot ? (user.dominantFoot === 'destro' ? 'Destro' : user.dominantFoot === 'sinistro' ? 'Sinistro' : 'Ambidestro') : 'Non specificato' },
            { label: 'Disponibilità', value: availability }
        ];
    }

    if (role.includes('player') || role.includes('giocatore')) {
        const details = [
            { label: 'Sport', value: sportLabel },
            { label: 'Ruolo in campo', value: user?.currentRole || user?.professionalRoleLabel || 'Non specificato' },
            { label: 'Livello / categoria', value: level },
            { label: 'Piede', value: user?.dominantFoot ? (user.dominantFoot === 'destro' ? 'Destro' : user.dominantFoot === 'sinistro' ? 'Sinistro' : 'Ambidestro') : 'Non specificato' },
            { label: 'Disponibilità', value: availability }
        ];
        if (user?.secondaryRole) {
            details.splice(2, 0, { label: 'Ruolo secondario', value: user.secondaryRole });
        }
        return details;
    }

    if (role.includes('agent') || role.includes('agente')) {
        return [
            { label: 'Discipline seguite', value: sportLabel },
            { label: 'Ruolo', value: user?.currentRole || user?.professionalRole || 'Agente' },
            { label: 'Portfolio attivo', value: `${user?.annunciAttivi ?? 0} ricerche` },
            { label: 'Richieste gestite', value: `${user?.candidatureRicevute ?? 0} candidature` }
        ];
    }

    if (role.includes('director') || role.includes('ds')) {
        return [
            { label: 'Discipline', value: sportLabel },
            { label: 'Ruolo', value: user?.currentRole || 'Direttore Sportivo' },
            { label: 'Annunci gestiti', value: `${user?.annunciAttivi ?? 0}` },
            { label: 'Candidature ricevute', value: `${user?.candidatureRicevute ?? 0}` }
        ];
    }

    return [
        { label: 'Professione', value: user?.professionalRole || 'Non specificato' },
        { label: 'Ambito', value: sportLabel },
        { label: 'Ruolo attuale', value: user?.currentRole || 'Non specificato' },
        { label: 'Disponibilità', value: availability }
    ];
}

const InformazioniTab = ({ user, clubName, followersCount }: { user: any; clubName?: string | null; followersCount?: number }) => {
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setIsOwner(id !== null && String(id) === String(user?.id))
    }, [user?.id])

    const sports = useMemo(() => {
        if (Array.isArray(user?.sports) && user.sports.length > 0) return user.sports.filter(Boolean)
        return user?.sport ? [user.sport] : []
    }, [user])

    const mainSport = sports[0] || user?.sport || undefined
    const sportNorm = (mainSport || '').toString().toLowerCase()
    const isPlayerRole = useMemo(() => {
        const r = (user?.professionalRole || '').toLowerCase()
        return r.includes('player') || r.includes('giocatore')
    }, [user?.professionalRole])

    const experiences = Array.isArray(user?.experiences) ? user.experiences : []
    const roleDetails = buildRoleDetails(user, sports)

    const quickStats = [
        { label: 'Annunci attivi', value: user?.annunciAttivi ?? 0 },
        { label: 'Candidature ricevute', value: user?.candidatureRicevute ?? 0 },
        { label: 'Followers', value: followersCount ?? user?.followers ?? 0 },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Profilo</h2>
                    <p className="text-sm text-gray-600">Riepilogo, dettagli ruolo e percorso professionale.</p>
                </div>
                {isOwner && (
                    <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 rounded-lg btn btn-primary"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        Modifica profilo
                    </Link>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* ── PLAYER: Hero Stats Banner ── */}
                {isPlayerRole && (() => {
                    const mainSportStr = sports[0] || user?.sport || ''
                    const latestExp = experiences.length > 0 ? experiences[0] : null
                    const category = latestExp?.category || ''
                    const categoryTier = latestExp?.categoryTier || ''
                    const position = user?.footballPrimaryPosition || latestExp?.primaryPosition || user?.currentRole || ''
                    const totals = experiences.reduce((acc: any, e: any) => {
                        acc.appearances += Number(e.appearances) || 0
                        acc.goals += Number(e.goals) || 0
                        acc.assists += Number(e.assists) || 0
                        return acc
                    }, { appearances: 0, goals: 0, assists: 0 })
                    return (
                        <div className="lg:col-span-3 rounded-xl bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-5 text-white shadow-lg">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                {/* Sport + Category */}
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getSportIcon(mainSportStr)}</span>
                                    <div>
                                        <span className="text-xl font-bold uppercase tracking-wide">{mainSportStr || 'Sport'}</span>
                                        {position && (
                                            <p className="text-sm text-white/80 font-medium">{position}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {categoryTier && (
                                        <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/20 border border-white/30 uppercase tracking-widest">
                                            {categoryTier}
                                        </span>
                                    )}
                                    {category && (
                                        <span className="text-sm font-extrabold px-4 py-1.5 rounded-full bg-white text-green-700 shadow">
                                            {category}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Stats grid */}
                            {(totals.appearances > 0 || totals.goals > 0) && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                                        <div className="text-2xl font-extrabold">{totals.appearances}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Presenze</div>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                                        <div className="text-2xl font-extrabold">{totals.goals}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Gol</div>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                                        <div className="text-2xl font-extrabold">{totals.assists}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Assist</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })()}

                <div className={`${isPlayerRole ? 'lg:col-span-2' : 'lg:col-span-2'} rounded-lg border border-gray-200 bg-green-50 p-4 shadow-sm`}>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-green-700 font-semibold border border-green-200">
                            <UserIcon className="w-4 h-4" />
                            {user?.professionalRole || 'Professionista'}
                        </span>
                        {sports.length > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium border border-green-100">
                                {getSportIcon(sports[0])} {sports.join(', ')}
                            </span>
                        )}
                        {user?.availability && (
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${user.availability === 'Disponibile'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {user.availability === 'Disponibile' ? '🟢 ' : ''}{user.availability}
                            </span>
                        )}
                        {user?.createdAt && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                                <CalendarDaysIcon className="w-4 h-4" />
                                Iscritto dal {formatDate(user.createdAt)}
                            </span>
                        )}
                    </div>

                    {user?.bio && (
                        <p className="mt-4 text-gray-800 leading-relaxed">{user.bio}</p>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-green-50 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-secondary mb-3">Club attuale</h3>
                    <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-200">
                        <p className="text-xs text-gray-500">Club</p>
                        <p className="text-sm font-semibold text-gray-900">{clubName || 'Nessun club'}</p>
                    </div>
                </div>

            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Dettagli ruolo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roleDetails.slice(0, 3).map((item) => (
                        <div key={item.label} className="rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-500">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900">{item.value || 'Non indicato'}</p>
                        </div>
                    ))}
                    {/* Ruolo specifico e dominanza SOLO per Player e sport coerente */}
                    {user?.professionalRole === 'Player' && user?.specificRole && (
                        <div className="rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-500">Ruolo specifico</p>
                            <p className="text-sm font-semibold text-gray-900">{user.specificRole}</p>
                        </div>
                    )}
                    {user?.professionalRole === 'Player' && user?.dominantFoot && Array.isArray(user?.sports) && user.sports[0] === 'Calcio' && (
                        <div className="rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-500">Piede dominante</p>
                            <p className="text-sm font-semibold text-gray-900">{user.dominantFoot === 'destro' ? 'Destro' : user.dominantFoot === 'sinistro' ? 'Sinistro' : 'Ambidestro'}</p>
                        </div>
                    )}
                    {user?.professionalRole === 'Player' && user?.dominantHand && Array.isArray(user?.sports) && (user.sports[0] === 'Basket' || user.sports[0] === 'Pallavolo') && (
                        <div className="rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-500">Mano dominante</p>
                            <p className="text-sm font-semibold text-gray-900">{user.dominantHand === 'destra' ? 'Destra' : user.dominantHand === 'sinistra' ? 'Sinistra' : 'Ambidestra'}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Esperienze e percorso</h3>
                    {(() => {
                        const toNumber = (v: any) => {
                            if (v === null || v === undefined || v === '') return undefined
                            const n = typeof v === 'number' ? v : Number(v)
                            return Number.isFinite(n) ? n : undefined
                        }

                        // DEBUG: Verifica dati experiences
                        console.log('🔍 DEBUG Experiences:', experiences)

                        const careerEntries = (Array.isArray(experiences) ? experiences : []).map((exp: any) => {
                            console.log('🔍 DEBUG Mapping exp:', { season: exp.season, from: exp.from, to: exp.to, team: exp.team })
                            return {
                                role: exp.role || exp.title || 'Ruolo non indicato',
                                team: exp.team || exp.company || '',
                                category: exp.category || '',
                                season: exp.season,
                                from: exp.from,
                                to: exp.to,
                                isCurrentlyPlaying: exp.isCurrentlyPlaying,
                                summary: exp.summary || exp.description || '',
                                stats: {
                                    goals: toNumber(exp.goals),
                                    cleanSheets: toNumber(exp.cleanSheets),
                                    appearances: toNumber(exp.appearances),
                                    pointsPerGame: toNumber(exp.pointsPerGame),
                                    assists: toNumber(exp.assists),
                                    rebounds: toNumber(exp.rebounds),
                                    volleyAces: toNumber(exp.volleyAces),
                                    volleyBlocks: toNumber(exp.volleyBlocks),
                                    volleyDigs: toNumber(exp.volleyDigs),
                                }
                            }
                        })

                        if (!careerEntries || careerEntries.length === 0) {
                            return <p className="text-sm text-gray-600">Nessuna esperienza inserita. {isOwner && 'Aggiungila da Modifica profilo.'}</p>
                        }

                        return (
                            <div className="space-y-3">
                                {careerEntries.map((exp: any, idx: number) => (
                                    <div key={`${exp.role}-${idx}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-2 bg-green-50 rounded-lg">
                                                <BriefcaseIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-gray-900 text-base">{exp.role}</p>
                                                    {exp.team && <span className="text-sm text-gray-600 font-medium">@ {exp.team}</span>}
                                                    {exp.category && (
                                                        <span className="text-xs font-bold rounded-full bg-green-100 text-green-800 px-3 py-1 border border-green-200 uppercase tracking-wider">{exp.category}</span>
                                                    )}
                                                </div>
                                            {(() => {
                                                // DEBUG: Verifica valori exp nel rendering
                                                console.log('🎨 DEBUG Rendering exp:', {
                                                    season: exp.season,
                                                    seasonType: typeof exp.season,
                                                    hasSeason: !!exp.season,
                                                    seasonTrimmed: exp.season?.trim(),
                                                    from: exp.from,
                                                    to: exp.to
                                                })

                                                // Priorità: mostra stagione se presente, altrimenti mostra date specifiche
                                                if (exp.season && exp.season.trim() !== '') {
                                                    console.log('✅ Showing season:', exp.season)
                                                    // Mostra stagione + eventualmente date precise tra parentesi
                                                    let periodText = `Stagione ${exp.season}`
                                                    if (exp.from || exp.to) {
                                                        const fromFormatted = exp.from ? new Date(exp.from).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
                                                        const toFormatted = exp.isCurrentlyPlaying ? 'Presente' : exp.to ? new Date(exp.to).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
                                                        if (fromFormatted || toFormatted) {
                                                            periodText += ` (${fromFormatted || '—'} - ${toFormatted || 'Presente'})`
                                                        }
                                                    }
                                                    return <p className="text-xs text-gray-500">{periodText}</p>
                                                } else if (exp.from || exp.to) {
                                                    console.log('⚠️ Showing old format dates')
                                                    // Fallback: mostra solo date (vecchio formato)
                                                    return <p className="text-xs text-gray-500">{exp.from || '—'} - {exp.to || 'Presente'}</p>
                                                }
                                                console.log('❌ No period to show')
                                                return null
                                            })()}
                                            {exp.summary && (
                                                <p className="text-sm text-gray-700">{exp.summary}</p>
                                            )}
                                            {isPlayerRole && (() => {
                                                const s = exp.stats || {}
                                                const hasAny = [s.goals, s.cleanSheets, s.pointsPerGame, s.assists, s.rebounds, s.volleyAces, s.volleyBlocks, s.volleyDigs, s.appearances]
                                                    .some(v => v !== null && v !== undefined)
                                                if (!hasAny) return null
                                                const isFootball = sportNorm === 'calcio'
                                                const isBasket = sportNorm === 'basket'
                                                const isVolley = sportNorm === 'pallavolo'

                                                const statItems: { label: string; value: number; color: string }[] = []
                                                if (s.appearances != null) statItems.push({ label: 'Presenze', value: s.appearances, color: 'green' })
                                                if (isFootball && s.goals != null) statItems.push({ label: 'Gol', value: s.goals, color: 'emerald' })
                                                if (isFootball && s.assists != null) statItems.push({ label: 'Assist', value: s.assists, color: 'teal' })
                                                if (isFootball && s.cleanSheets != null) statItems.push({ label: 'Clean Sheet', value: s.cleanSheets, color: 'sky' })
                                                if (isBasket && s.pointsPerGame != null) statItems.push({ label: 'PPG', value: s.pointsPerGame, color: 'emerald' })
                                                if (isBasket && s.assists != null) statItems.push({ label: 'Assist', value: s.assists, color: 'teal' })
                                                if (isBasket && s.rebounds != null) statItems.push({ label: 'Rimbalzi', value: s.rebounds, color: 'amber' })
                                                if (isVolley && s.volleyAces != null) statItems.push({ label: 'Ace', value: s.volleyAces, color: 'emerald' })
                                                if (isVolley && s.volleyBlocks != null) statItems.push({ label: 'Muri', value: s.volleyBlocks, color: 'teal' })
                                                if (isVolley && s.volleyDigs != null) statItems.push({ label: 'Difese', value: s.volleyDigs, color: 'amber' })

                                                const colorMap: Record<string, string> = {
                                                    green: 'bg-green-50 border-green-200 text-green-700',
                                                    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                                                    teal: 'bg-teal-50 border-teal-200 text-teal-700',
                                                    sky: 'bg-sky-50 border-sky-200 text-sky-700',
                                                    amber: 'bg-amber-50 border-amber-200 text-amber-700',
                                                }

                                                return (
                                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {statItems.map((si, i) => (
                                                            <div key={i} className={`${colorMap[si.color] || colorMap.green} border rounded-lg px-2 py-2 text-center`}>
                                                                <div className="text-lg font-extrabold">{si.value}</div>
                                                                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{si.label}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Contatti</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        {user?.email && (
                            <div className="flex items-center gap-2">
                                <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                                <span>{user.email}</span>
                            </div>
                        )}
                        {(user?.city || user?.country) && (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-gray-500" />
                                <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                            </div>
                        )}
                        {user?.birthDate && (
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                <span>Nato il {formatDate(user.birthDate)}</span>
                            </div>
                        )}
                    </div>
                    {/* Qualifiche & Certificazioni */}
                    {(() => {
                        const role = (user?.professionalRole || '').toString()
                        const isCoach = role === 'Coach'
                        const isAgent = role === 'Agent'
                        const isStaff = ['Athletic Trainer', 'Nutritionist', 'Physio/Masseur', 'Talent Scout'].includes(role)

                        if (isCoach) {
                            const licenses = Array.isArray(user?.uefaLicenses) ? user.uefaLicenses : []
                            const hasLicenses = licenses.length > 0
                            return (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-900">Qualifiche (Coach)</h4>
                                    {!hasLicenses && !user?.coachSpecializations && (
                                        <p className="text-sm text-gray-600">Nessuna qualifica inserita.</p>
                                    )}
                                    {hasLicenses && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {licenses.map((lic: string) => (
                                                <span key={lic} className="text-xs rounded-full bg-base-300 text-primary px-2 py-1 font-semibold">{lic}</span>
                                            ))}
                                        </div>
                                    )}
                                    {user?.coachSpecializations && (
                                        <p className="mt-2 text-sm text-gray-700">{user.coachSpecializations}</p>
                                    )}
                                </div>
                            )
                        }

                        if (isAgent) {
                            const hasLicense = !!user?.hasFifaLicense
                            return (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-900">Qualifiche (Agente)</h4>
                                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                                        <p>Licenza FIFA: {hasLicense ? 'Sì' : 'No'}</p>
                                        {hasLicense && user?.fifaLicenseNumber && (
                                            <p>Numero licenza: {user.fifaLicenseNumber}</p>
                                        )}
                                        {user?.agentNotes && (
                                            <p className="text-gray-700">{user.agentNotes}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        if (isStaff) {
                            const certs = Array.isArray(user?.certifications) ? user.certifications : []
                            return (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-900">Certificazioni</h4>
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
                        }
                        return null
                    })()}
                </div>
            </div>
            </div>
            )
}

            interface ProfileContentProps {
                user: any
            clubName?: string | null
            followersCount?: number
            followingCount?: number
}

            export default function ProfileContent({user, clubName, followersCount, followingCount}: ProfileContentProps) {
    const [activeTab, setActiveTab] = useState<TabType>('informazioni')

                // Determina se mostrare la tab autovalutazione
                const showAutovalutazione = !!(
        (user?.playerSelfEvaluation && Object.keys(user.playerSelfEvaluation).length > 0) ||
        (user?.coachSelfEvaluation && Object.keys(user.coachSelfEvaluation).length > 0)
                )

                return (
                <div className="space-y-0">
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        showAutovalutazione={showAutovalutazione}
                    />

                    <div className="py-6">
                        {activeTab === 'informazioni' && (
                            <InformazioniTab user={user} clubName={clubName} followersCount={followersCount} />
                        )}
                        {activeTab === 'autovalutazione' && (
                            <div className="px-6">
                                <SelfEvaluationDisplay
                                    evaluation={user?.playerSelfEvaluation || user?.coachSelfEvaluation}
                                    professionalRole={user?.professionalRole}
                                    sports={user?.sports}
                                />
                            </div>
                        )}
                    </div>
                </div>
                )
}
