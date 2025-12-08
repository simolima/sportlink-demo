"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserGroupIcon, BuildingOfficeIcon, BriefcaseIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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
                    fetch('/api/users'),
                    fetch('/api/clubs'),
                    fetch(`/api/opportunities?search=${encodeURIComponent(query)}&activeOnly=true`),
                ])
                const usersData = usersRes.ok ? await usersRes.json() : []
                const clubsData = clubsRes.ok ? await clubsRes.json() : []
                const oppsData = oppsRes.ok ? await oppsRes.json() : []
                setUsers(Array.isArray(usersData) ? usersData : [])
                setClubs(Array.isArray(clubsData) ? clubsData : [])
                setOpps(Array.isArray(oppsData) ? oppsData : [])
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
            regex.test(part) ? (
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
