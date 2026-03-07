"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserGroupIcon, BellAlertIcon } from '@heroicons/react/24/outline'

interface Props {
    clubId?: string | number | null
}

interface JoinRequest {
    id: string | number
    user?: {
        firstName?: string
        lastName?: string
        professionalRole?: string
    }
    requestedRole?: string
    requestedPosition?: string
    requestedAt?: string
}

export default function ClubJoinRequestsWidget({ clubId }: Props) {
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<JoinRequest[]>([])

    useEffect(() => {
        const load = async () => {
            if (!clubId) {
                setLoading(false)
                return
            }
            try {
                const res = await fetch(`/api/club-join-requests?clubId=${clubId}&status=pending`)
                if (res.ok) {
                    const data = await res.json()
                    setRequests(data || [])
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [clubId])

    if (!clubId) {
        return (
            <div className="glass-widget rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-base-300/70 rounded-lg flex items-center justify-center">
                        <BellAlertIcon className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Richieste di ingresso</h3>
                        <p className="text-xs glass-subtle-text">Seleziona una società per vedere le richieste.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-widget rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <BellAlertIcon className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Richieste di ingresso</h3>
                        <p className="text-xs glass-subtle-text">Giocatori che vogliono entrare in rosa</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${requests.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-base-300/70 text-secondary/75'}`}>
                    {requests.length} in attesa
                </span>
            </div>

            {loading ? (
                <div className="text-sm glass-subtle-text">Caricamento...</div>
            ) : requests.length === 0 ? (
                <div className="text-sm glass-subtle-text">Nessuna richiesta in attesa.</div>
            ) : (
                <div className="space-y-3">
                    {requests.slice(0, 3).map((r) => (
                        <div key={r.id} className="p-3 bg-base-300/65 border border-base-300 rounded-xl">
                            <div className="font-semibold text-white text-sm">{r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'Utente' : 'Utente'}</div>
                            <div className="text-xs glass-subtle-text">
                                {r.requestedRole || 'Player'}{r.requestedPosition ? ` • ${r.requestedPosition}` : ''}
                            </div>
                            {r.requestedAt && (
                                <div className="text-[11px] glass-quiet-text mt-1">
                                    {new Date(r.requestedAt).toLocaleDateString('it-IT')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Link
                href={`/clubs/${clubId}?tab=membri`}
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
                <UserGroupIcon className="w-4 h-4" />
                Vai a rosa e richieste
            </Link>
        </div>
    )
}
