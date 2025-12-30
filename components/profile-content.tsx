'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDaysIcon, EnvelopeIcon, MapPinIcon, PencilSquareIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import ProfileTabs from './profile-tabs'

type TabType = 'informazioni'

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
                <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-blue-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-primary font-semibold border border-blue-200">
                            <UserIcon className="w-4 h-4" />
                            {user?.professionalRole || 'Professionista'}
                        </span>
                        {sports.length > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                                {sports.join(', ')}
                            </span>
                        )}
                        {user?.availability && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                                Disponibilità: {user.availability}
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

                <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 shadow-sm">
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
                        const careerEntries = (Array.isArray(experiences) ? experiences : []).map((exp: any) => ({
                            role: exp.role || exp.title || 'Ruolo non indicato',
                            team: exp.team || exp.company || '',
                            category: exp.category || '',
                            from: exp.from || '',
                            to: exp.to || '',
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
                        }))

                        if (!careerEntries || careerEntries.length === 0) {
                            return <p className="text-sm text-gray-600">Nessuna esperienza inserita. {isOwner && 'Aggiungila da Modifica profilo.'}</p>
                        }

                        return (
                            <div className="space-y-3">
                                {careerEntries.map((exp: any, idx: number) => (
                                    <div key={`${exp.role}-${idx}`} className="flex gap-3 border border-gray-100 rounded-lg p-3">
                                        <div className="mt-1">
                                            <BriefcaseIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-gray-900">{exp.role}</p>
                                                {exp.team && <span className="text-sm text-gray-600">@ {exp.team}</span>}
                                                {exp.category && (
                                                    <span className="text-xs rounded-full bg-base-300 text-primary px-2 py-1 font-semibold">{exp.category}</span>
                                                )}
                                            </div>
                                            {(exp.from || exp.to) && (
                                                <p className="text-xs text-gray-500">{exp.from || '—'} - {exp.to || 'Presente'}</p>
                                            )}
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
                                                return (
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                        {isFootball && s.goals != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Gol: {s.goals}</span>
                                                        )}
                                                        {isFootball && s.cleanSheets != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Clean sheet: {s.cleanSheets}</span>
                                                        )}
                                                        {isBasket && s.pointsPerGame != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">PPG: {s.pointsPerGame}</span>
                                                        )}
                                                        {isBasket && s.assists != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Assist: {s.assists}</span>
                                                        )}
                                                        {isBasket && s.rebounds != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Rimbalzi: {s.rebounds}</span>
                                                        )}
                                                        {isVolley && s.volleyAces != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Ace: {s.volleyAces}</span>
                                                        )}
                                                        {isVolley && s.volleyBlocks != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Muri: {s.volleyBlocks}</span>
                                                        )}
                                                        {isVolley && s.volleyDigs != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Difese: {s.volleyDigs}</span>
                                                        )}
                                                        {s.appearances != null && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-700">Presenze: {s.appearances}</span>
                                                        )}
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
                        const isStaff = ['Athletic Trainer', 'Nutritionist', 'Physio/Masseur'].includes(role)

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

export default function ProfileContent({ user, clubName, followersCount, followingCount }: ProfileContentProps) {
    const [activeTab, setActiveTab] = useState<TabType>('informazioni')

    return (
        <div className="space-y-0">
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="py-6">
                {activeTab === 'informazioni' && (
                    <InformazioniTab user={user} clubName={clubName} followersCount={followersCount} />
                )}
            </div>
        </div>
    )
}
