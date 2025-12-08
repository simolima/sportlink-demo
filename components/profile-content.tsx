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
    const role = (user?.professionalRole || '').toLowerCase()
    const availability = user?.availability ? user.availability : 'Non specificato'
    const level = user?.level ? user.level : 'Non specificato'
    const sportLabel = sports.length ? sports.join(', ') : (user?.sport || 'Non specificato')

    if (role.includes('player') || role.includes('giocatore')) {
        return [
            { label: 'Sport', value: sportLabel },
            { label: 'Ruolo in campo', value: user?.currentRole || user?.professionalRoleLabel || 'Non specificato' },
            { label: 'Livello / categoria', value: level },
            { label: 'Disponibilità', value: availability }
        ]
    }

    if (role.includes('agent') || role.includes('agente')) {
        return [
            { label: 'Discipline seguite', value: sportLabel },
            { label: 'Ruolo', value: user?.currentRole || user?.professionalRole || 'Agente' },
            { label: 'Portfolio attivo', value: `${user?.annunciAttivi ?? 0} ricerche` },
            { label: 'Richieste gestite', value: `${user?.candidatureRicevute ?? 0} candidature` }
        ]
    }

    if (role.includes('director') || role.includes('ds')) {
        return [
            { label: 'Discipline', value: sportLabel },
            { label: 'Ruolo', value: user?.currentRole || 'Direttore Sportivo' },
            { label: 'Annunci gestiti', value: `${user?.annunciAttivi ?? 0}` },
            { label: 'Candidature ricevute', value: `${user?.candidatureRicevute ?? 0}` }
        ]
    }

    return [
        { label: 'Professione', value: user?.professionalRole || 'Non specificato' },
        { label: 'Ambito', value: sportLabel },
        { label: 'Ruolo attuale', value: user?.currentRole || 'Non specificato' },
        { label: 'Disponibilità', value: availability }
    ]
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
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Esperienze e percorso</h3>
                    {(() => {
                        const careerEntries = (Array.isArray(experiences) ? experiences : []).map((exp: any) => ({
                            role: exp.role || exp.title || 'Ruolo non indicato',
                            team: exp.team || exp.company || '',
                            category: exp.category || '',
                            from: exp.from || '',
                            to: exp.to || '',
                            summary: exp.summary || exp.description || '',
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
