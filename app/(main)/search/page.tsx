"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserGroupIcon, BuildingOfficeIcon, BriefcaseIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    professionalRole?: string
    sports?: string[]
    sport?: string
    city?: string
}

interface Club {
    id: string | number
    name?: string
    city?: string
    sport?: string
    logoUrl?: string
}

interface Opportunity {
    id: string | number
    title?: string
    type?: string
    sport?: string
    level?: string
    city?: string
    club?: { id: string | number; name?: string; logoUrl?: string }
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q')?.trim() || ''

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [clubs, setClubs] = useState<Club[]>([])
    const [opps, setOpps] = useState<Opportunity[]>([])

    const extractArray = (payload: any): any[] => {
        if (Array.isArray(payload)) return payload
        if (payload && Array.isArray(payload.data)) return payload.data
        return []
    }

    useEffect(() => {
        const fetchAll = async () => {
            if (!query) {
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const [usersRes, clubsRes, oppsRes] = await Promise.all([
                    fetch(`/api/search/professionals?searchTerm=${encodeURIComponent(query)}&limit=30&offset=0`),
                    fetch(`/api/clubs?search=${encodeURIComponent(query)}`),
                    fetch(`/api/opportunities?search=${encodeURIComponent(query)}&activeOnly=true`),
                ])
                const usersPayload = usersRes.ok ? await usersRes.json() : []
                const clubsPayload = clubsRes.ok ? await clubsRes.json() : []
                const oppsPayload = oppsRes.ok ? await oppsRes.json() : []

                const normalizedUsers: User[] = extractArray(usersPayload).map((u: any) => ({
                    id: u.id,
                    firstName: u.firstName || u.first_name || '',
                    lastName: u.lastName || u.last_name || '',
                    email: u.email || '',
                    professionalRole: u.professionalRole || u.roleId || u.role_id || '',
                    sports: Array.isArray(u.sports) ? u.sports : [],
                    sport: u.sport || null,
                    city: u.city || '',
                }))

                const normalizedClubs: Club[] = extractArray(clubsPayload).map((c: any) => ({
                    id: c.id,
                    name: c.name || '',
                    city: c.city || '',
                    sport: c.sport || (Array.isArray(c.sports) && c.sports.length > 0 ? c.sports[0] : ''),
                    logoUrl: c.logoUrl || c.logo_url || '',
                }))

                const normalizedOpps: Opportunity[] = extractArray(oppsPayload).map((o: any) => ({
                    id: o.id,
                    title: o.title || '',
                    type: o.type || o.roleRequired || '',
                    sport: o.sport || '',
                    level: o.level || o.contractType || '',
                    city: o.city || o.location || '',
                    club: o.club ? {
                        id: o.club.id,
                        name: o.club.name,
                        logoUrl: o.club.logoUrl || o.club.logo_url,
                    } : undefined,
                }))

                setUsers(normalizedUsers)
                setClubs(normalizedClubs)
                setOpps(normalizedOpps)
            } catch (err) {
                setUsers([])
                setClubs([])
                setOpps([])
                setError('Errore durante la ricerca. Riprova.')
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [query])

    const highlight = (text: string) => {
        if (!query) return text
        const regex = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig')
        return text.split(regex).map((part, i) =>
            i % 2 === 1 ? (
                <span key={i} className="font-bold text-brand-600">{part}</span>
            ) : (
                <span key={i}>{part}</span>
            )
        )
    }

    const getInitials = (firstName?: string, lastName?: string) => {
        const f = (firstName || '').charAt(0).toUpperCase()
        const l = (lastName || '').charAt(0).toUpperCase()
        return f + l || '?'
    }

    const filteredUsers = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return users.filter((u) => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
            return (
                fullName.includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.professionalRole || '').toLowerCase().includes(q)
            )
        })
    }, [users, query])

    const filteredClubs = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return clubs.filter((c) => {
            return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.city || '').toLowerCase().includes(q) ||
                (c.sport || '').toLowerCase().includes(q)
            )
        })
    }, [clubs, query])

    const filteredOpps = useMemo(() => {
        if (!query) return []
        return opps
    }, [opps, query])

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const q = (formData.get('q') as string).trim()
        if (!q) return
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    const SkeletonRow = () => (
        <div className="flex items-center gap-3 py-3 px-2 border-b border-slate-100 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ricerca globale</h1>
                        <p className="text-gray-500 text-sm">Persone, società e opportunità</p>
                    </div>
                </div>

                {/* Search bar */}
                <form onSubmit={onSubmit} className="mb-8 flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Cerca persone, società, opportunità"
                            className="flex-1 ml-3 bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition text-sm"
                    >
                        Cerca
                    </button>
                </form>

                {!query && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 text-gray-500 text-sm">
                        Digita qualcosa per iniziare la ricerca.
                    </div>
                )}

                {query && (
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                                {error}
                            </div>
                        )}
                        {!loading && !error && filteredUsers.length === 0 && filteredClubs.length === 0 && filteredOpps.length === 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 text-gray-500 text-sm">
                                Nessun risultato trovato per "{query}".
                            </div>
                        )}

                        {/* Persone */}
                        {(loading || filteredUsers.length > 0) && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <UserGroupIcon className="w-5 h-5 text-brand-600" />
                                        <h2 className="font-semibold text-gray-900">Persone</h2>
                                        {!loading && (
                                            <span className="text-xs text-gray-400 font-medium">{filteredUsers.length}</span>
                                        )}
                                    </div>
                                    {!loading && filteredUsers.length > 0 && (
                                        <Link
                                            href={`/athletes?search=${encodeURIComponent(query)}`}
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
                                        >
                                            Vedi tutti
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {loading ? (
                                        <>
                                            <SkeletonRow />
                                            <SkeletonRow />
                                            <SkeletonRow />
                                        </>
                                    ) : (
                                        filteredUsers.slice(0, 8).map((u) => (
                                            <Link
                                                key={u.id}
                                                href={`/profile/${u.id}`}
                                                className="flex items-center gap-3 py-3 px-6 hover:bg-slate-50 transition"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {getInitials(u.firstName, u.lastName)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">
                                                        {highlight(`${u.firstName || ''} ${u.lastName || ''}`.trim())}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {highlight(u.professionalRole || 'Ruolo non specificato')}
                                                        {u.city ? ` · ${u.city}` : ''}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Società */}
                        {(loading || filteredClubs.length > 0) && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <BuildingOfficeIcon className="w-5 h-5 text-brand-600" />
                                        <h2 className="font-semibold text-gray-900">Società</h2>
                                        {!loading && (
                                            <span className="text-xs text-gray-400 font-medium">{filteredClubs.length}</span>
                                        )}
                                    </div>
                                    {!loading && filteredClubs.length > 0 && (
                                        <Link
                                            href={`/clubs?search=${encodeURIComponent(query)}`}
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
                                        >
                                            Vedi tutte
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {loading ? (
                                        <>
                                            <SkeletonRow />
                                            <SkeletonRow />
                                            <SkeletonRow />
                                        </>
                                    ) : (
                                        filteredClubs.slice(0, 8).map((c) => (
                                            <Link
                                                key={c.id}
                                                href={`/clubs/${c.id}`}
                                                className="flex items-center gap-3 py-3 px-6 hover:bg-slate-50 transition"
                                            >
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt={c.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                                                        <BuildingOfficeIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">
                                                        {highlight(c.name || 'Società')}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {highlight(c.sport || 'Sport non indicato')}
                                                        {c.city ? ` · ${c.city}` : ''}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Opportunità */}
                        {(loading || filteredOpps.length > 0) && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <BriefcaseIcon className="w-5 h-5 text-brand-600" />
                                        <h2 className="font-semibold text-gray-900">Opportunità</h2>
                                        {!loading && (
                                            <span className="text-xs text-gray-400 font-medium">{filteredOpps.length}</span>
                                        )}
                                    </div>
                                    {!loading && filteredOpps.length > 0 && (
                                        <Link
                                            href={`/opportunities?search=${encodeURIComponent(query)}`}
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
                                        >
                                            Vedi tutte
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {loading ? (
                                        <>
                                            <SkeletonRow />
                                            <SkeletonRow />
                                            <SkeletonRow />
                                        </>
                                    ) : (
                                        filteredOpps.slice(0, 8).map((o) => (
                                            <Link
                                                key={o.id}
                                                href={`/opportunities?focus=${o.id}`}
                                                className="flex items-center gap-3 py-3 px-6 hover:bg-slate-50 transition"
                                            >
                                                {o.club?.logoUrl ? (
                                                    <img src={o.club.logoUrl} alt={o.club.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                                                        <BriefcaseIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">
                                                        {highlight(o.title || 'Opportunità')}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {highlight(`${o.sport || 'Sport'}${o.level ? ' · ' + o.level : ''}`)}
                                                        {(o.city || o.club?.name) ? ` · ${o.city || o.club?.name}` : ''}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

interface User {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    professionalRole?: string
    sports?: string[]
    sport?: string
    city?: string
}

interface Club {
    id: string | number
    name?: string
    city?: string
    sport?: string
    logoUrl?: string
}

interface Opportunity {
    id: string | number
    title?: string
    type?: string
    sport?: string
    level?: string
    city?: string
    club?: { id: string | number; name?: string; logoUrl?: string }
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q')?.trim() || ''

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [clubs, setClubs] = useState<Club[]>([])
    const [opps, setOpps] = useState<Opportunity[]>([])

    const extractArray = (payload: any): any[] => {
        if (Array.isArray(payload)) return payload
        if (payload && Array.isArray(payload.data)) return payload.data
        return []
    }

    useEffect(() => {
        const fetchAll = async () => {
            if (!query) {
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const [usersRes, clubsRes, oppsRes] = await Promise.all([
                    fetch(`/api/search/professionals?searchTerm=${encodeURIComponent(query)}&limit=30&offset=0`),
                    fetch(`/api/clubs?search=${encodeURIComponent(query)}`),
                    fetch(`/api/opportunities?search=${encodeURIComponent(query)}&activeOnly=true`),
                ])
                const usersPayload = usersRes.ok ? await usersRes.json() : []
                const clubsPayload = clubsRes.ok ? await clubsRes.json() : []
                const oppsPayload = oppsRes.ok ? await oppsRes.json() : []

                const normalizedUsers: User[] = extractArray(usersPayload).map((u: any) => ({
                    id: u.id,
                    firstName: u.firstName || u.first_name || '',
                    lastName: u.lastName || u.last_name || '',
                    email: u.email || '',
                    professionalRole: u.professionalRole || u.roleId || u.role_id || '',
                    sports: Array.isArray(u.sports) ? u.sports : [],
                    sport: u.sport || null,
                    city: u.city || '',
                }))

                const normalizedClubs: Club[] = extractArray(clubsPayload).map((c: any) => ({
                    id: c.id,
                    name: c.name || '',
                    city: c.city || '',
                    sport: c.sport || (Array.isArray(c.sports) && c.sports.length > 0 ? c.sports[0] : ''),
                    logoUrl: c.logoUrl || c.logo_url || '',
                }))

                const normalizedOpps: Opportunity[] = extractArray(oppsPayload).map((o: any) => ({
                    id: o.id,
                    title: o.title || '',
                    type: o.type || o.roleRequired || '',
                    sport: o.sport || '',
                    level: o.level || o.contractType || '',
                    city: o.city || o.location || '',
                    club: o.club ? {
                        id: o.club.id,
                        name: o.club.name,
                        logoUrl: o.club.logoUrl || o.club.logo_url,
                    } : undefined,
                }))

                setUsers(normalizedUsers)
                setClubs(normalizedClubs)
                setOpps(normalizedOpps)
            } catch (err) {
                setUsers([])
                setClubs([])
                setOpps([])
                setError('Errore durante la ricerca. Riprova.')
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [query])

    const highlight = (text: string) => {
        if (!query) return text
        const regex = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig')
        return text.split(regex).map((part, i) =>
            i % 2 === 1 ? (
                <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{part}</mark>
            ) : (
                <span key={i}>{part}</span>
            )
        )
    }

    const filteredUsers = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return users.filter((u) => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
            return (
                fullName.includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.professionalRole || '').toLowerCase().includes(q)
            )
        })
    }, [users, query])

    const filteredClubs = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return clubs.filter((c) => {
            return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.city || '').toLowerCase().includes(q) ||
                (c.sport || '').toLowerCase().includes(q)
            )
        })
    }, [clubs, query])

    const filteredOpps = useMemo(() => {
        if (!query) return []
        return opps
    }, [opps, query])

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const q = (formData.get('q') as string).trim()
        if (!q) return
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    const totalResults = filteredUsers.length + filteredClubs.length + filteredOpps.length

    return (
        <div className="min-h-screen bg-base-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Ricerca globale</h1>
                        <p className="text-secondary/80">Persone, società e opportunità</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="mb-8 flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-base-200 border border-base-300 rounded-lg px-4 py-2 shadow-sm">
                        <MagnifyingGlassIcon className="w-5 h-5 text-secondary/60" />
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Cerca persone, società, opportunità"
                            className="flex-1 ml-3 bg-transparent focus:outline-none text-secondary"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                    >
                        Cerca
                    </button>
                </form>

                {!query && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                        Digita qualcosa per iniziare la ricerca.
                    </div>
                )}

                {query && (
                    <div className="space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                                {error}
                            </div>
                        )}
                        {!loading && !error && totalResults === 0 && (
                            <div className="bg-base-200 border border-base-300 rounded-lg p-6 text-secondary/80">
                                Nessun risultato trovato per "{query}".
                            </div>
                        )}
                        {/* Persone */}
                        <div className="bg-base-200 border border-base-300 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <UserGroupIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-secondary">Persone</h2>
                                <span className="text-xs text-secondary/60">{filteredUsers.length}</span>
                            </div>
                            {loading ? (
                                <p className="text-sm text-secondary/60">Caricamento...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-sm text-gray-500">Nessun risultato</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredUsers.map((u) => (
                                        <Link
                                            key={u.id}
                                            href={`/profile/${u.id}`}
                                            className="border border-base-300 rounded-lg p-4 hover:border-primary transition bg-base-200"
                                        >
                                            <div className="font-semibold text-secondary">{highlight(`${u.firstName || ''} ${u.lastName || ''}`)}</div>
                                            <div className="text-sm text-secondary/80">{highlight(u.professionalRole || 'Ruolo non specificato')}</div>
                                            <div className="text-xs text-secondary/60">{highlight(u.sports?.join(', ') || u.sport || 'Sport non indicato')}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Società */}
                        <div className="bg-base-200 border border-base-300 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-secondary">Società</h2>
                                <span className="text-xs text-secondary/60">{filteredClubs.length}</span>
                            </div>
                            {loading ? (
                                <p className="text-sm text-secondary/60">Caricamento...</p>
                            ) : filteredClubs.length === 0 ? (
                                <p className="text-sm text-secondary/60">Nessun risultato</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredClubs.map((c) => (
                                        <Link
                                            key={c.id}
                                            href={`/clubs/${c.id}`}
                                            className="border border-base-300 rounded-lg p-4 hover:border-primary transition bg-base-200"
                                        >
                                            <div className="font-semibold text-secondary">{highlight(c.name || 'Società')}</div>
                                            <div className="text-sm text-secondary/80">{highlight(c.sport || 'Sport non indicato')}</div>
                                            <div className="text-xs text-secondary/60">{highlight(c.city || 'Località non indicata')}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Opportunità */}
                        <div className="bg-base-200 border border-base-300 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <BriefcaseIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-secondary">Opportunità</h2>
                                <span className="text-xs text-secondary/60">{filteredOpps.length}</span>
                            </div>
                            {loading ? (
                                <p className="text-sm text-secondary/60">Caricamento...</p>
                            ) : filteredOpps.length === 0 ? (
                                <p className="text-sm text-secondary/60">Nessun risultato</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredOpps.map((o) => (
                                        <Link
                                            key={o.id}
                                            href={`/opportunities?focus=${o.id}`}
                                            className="border border-base-300 rounded-lg p-4 hover:border-primary transition bg-base-200"
                                        >
                                            <div className="font-semibold text-secondary">{highlight(o.title || 'Opportunità')}</div>
                                            <div className="text-sm text-secondary/80">{highlight(`${o.sport || 'Sport'} • ${o.level || 'Livello'}`)}</div>
                                            <div className="text-xs text-secondary/60">{highlight(o.city || o.club?.name || 'Località / Club')}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
