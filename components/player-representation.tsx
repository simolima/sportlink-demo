'use client'

import { useCallback, useEffect, useState } from 'react'
import { Shield, Check, X, Ban, UserCircle } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/auth-fetch'

interface Affiliation {
    id: string | number
    agentId: string | number
    playerId: string | number
    status: 'pending' | 'active' | 'rejected'
    requestedAt: string
    affiliatedAt?: string
    message?: string
    agent?: {
        id: string | number
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

interface PlayerRepresentationProps {
    playerId: string | number
    isOwnProfile: boolean
}

export default function PlayerRepresentation({ playerId, isOwnProfile }: PlayerRepresentationProps) {
    const { showToast } = useToast()
    const [affiliations, setAffiliations] = useState<Affiliation[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAffiliations = useCallback(async () => {
        try {
            const res = await fetch(`/api/affiliations?playerId=${playerId}`)
            const data = await res.json()

            // Ensure data is an array
            if (Array.isArray(data)) {
                setAffiliations(data)
            } else {
                console.error('Unexpected response format:', data)
                setAffiliations([])
            }
        } catch (error) {
            console.error('Error fetching affiliations:', error)
            setAffiliations([])
        } finally {
            setLoading(false)
        }
    }, [playerId])

    useEffect(() => {
        fetchAffiliations()
    }, [fetchAffiliations])

    const handleAccept = async (affiliationId: string | number) => {
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/affiliations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    id: affiliationId,
                    status: 'active',
                    playerId,
                }),
            })

            if (res.ok) {
                showToast('success', 'Affiliazione accettata!', "Hai accettato l'affiliazione con successo")
                fetchAffiliations()
            } else {
                const error = await res.json().catch(() => null)
                if (res.status === 401) {
                    showToast('error', 'Sessione scaduta', 'Effettua nuovamente il login per completare l\'azione')
                } else if (res.status === 403) {
                    showToast('error', 'Accesso negato', 'Puoi gestire solo le richieste legate al tuo account player attivo')
                } else {
                    showToast('error', 'Errore', error?.error || "Impossibile accettare l'affiliazione")
                }
            }
        } catch (error) {
            showToast('error', 'Errore', "Impossibile accettare l'affiliazione")
        }
    }

    const handleReject = async (affiliationId: string | number) => {
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/affiliations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    id: affiliationId,
                    status: 'rejected',
                    playerId,
                }),
            })

            if (res.ok) {
                showToast('success', 'Richiesta rifiutata', 'La richiesta è stata rifiutata')
                fetchAffiliations()
            } else {
                const error = await res.json().catch(() => null)
                if (res.status === 401) {
                    showToast('error', 'Sessione scaduta', 'Effettua nuovamente il login per completare l\'azione')
                } else if (res.status === 403) {
                    showToast('error', 'Accesso negato', 'Puoi gestire solo le richieste legate al tuo account player attivo')
                } else {
                    showToast('error', 'Errore', error?.error || 'Impossibile rifiutare la richiesta')
                }
            }
        } catch (error) {
            showToast('error', 'Errore', 'Impossibile rifiutare la richiesta')
        }
    }

    const handleBlock = async (affiliationId: string | number) => {
        if (!confirm("Sei sicuro di voler bloccare questo agente? Non potrà più inviarti richieste.")) {
            return
        }

        try {
            const res = await fetch(`/api/affiliations?id=${affiliationId}&block=true&playerId=${playerId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                showToast('success', 'Agente bloccato', "L'agente è stato bloccato")
                fetchAffiliations()
            }
        } catch (error) {
            showToast('error', 'Errore', "Impossibile bloccare l'agente")
        }
    }

    const handleRemove = async (affiliationId: string | number) => {
        if (!confirm('Sei sicuro di voler rimuovere questa affiliazione?')) {
            return
        }

        try {
            const res = await fetch(`/api/affiliations?id=${affiliationId}&playerId=${playerId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                showToast('success', 'Affiliazione rimossa', "L'affiliazione è stata rimossa")
                fetchAffiliations()
            }
        } catch (error) {
            showToast('error', 'Errore', "Impossibile rimuovere l'affiliazione")
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    const pendingAffiliations = affiliations.filter((a) => a.status === 'pending')
    const acceptedAffiliations = affiliations.filter((a) => a.status === 'active')

    // Se non è il proprio profilo, mostra solo l'agente affiliato (se presente)
    if (!isOwnProfile) {
        if (acceptedAffiliations.length === 0) {
            return null // Non mostrare nulla se non c'è rappresentanza
        }

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-[#2341F0]" />
                    <h3 className="text-lg font-semibold text-gray-900">Rappresentanza</h3>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Link href={`/profile/${acceptedAffiliations[0].agent?.id}`}>
                        {acceptedAffiliations[0].agent?.avatarUrl ? (
                            <img
                                src={acceptedAffiliations[0].agent.avatarUrl}
                                alt="Agent"
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-semibold">
                                {acceptedAffiliations[0].agent?.firstName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </Link>
                    <div>
                        <p className="text-sm text-gray-600">Rappresentato da</p>
                        <Link
                            href={`/profile/${acceptedAffiliations[0].agent?.id}`}
                            className="font-semibold text-gray-900 hover:text-[#2341F0] transition"
                        >
                            {acceptedAffiliations[0].agent?.firstName} {acceptedAffiliations[0].agent?.lastName}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Se è il proprio profilo e non ci sono affiliazioni
    if (pendingAffiliations.length === 0 && acceptedAffiliations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-[#2341F0]" />
                    <h3 className="text-lg font-semibold text-gray-900">Rappresentanza</h3>
                </div>
                <p className="text-gray-600 text-sm">Nessun agente affiliato. Le richieste degli agenti appariranno qui.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Shield size={20} className="text-[#2341F0]" />
                <h3 className="text-lg font-semibold text-gray-900">Rappresentanza</h3>
            </div>

            {/* Richieste in attesa */}
            {pendingAffiliations.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Richieste in attesa</h4>
                    <div className="space-y-3">
                        {pendingAffiliations.map((affiliation) => (
                            <div
                                key={affiliation.id}
                                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${affiliation.agent?.id}`}>
                                            {affiliation.agent?.avatarUrl ? (
                                                <img
                                                    src={affiliation.agent.avatarUrl}
                                                    alt="Agent"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-semibold">
                                                    {affiliation.agent?.firstName?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </Link>
                                        <div>
                                            <Link
                                                href={`/profile/${affiliation.agent?.id}`}
                                                className="font-medium text-gray-900 hover:text-[#2341F0] transition"
                                            >
                                                {affiliation.agent?.firstName} {affiliation.agent?.lastName}
                                            </Link>
                                            <p className="text-xs text-gray-500">
                                                Richiesta il {new Date(affiliation.requestedAt).toLocaleDateString('it-IT')}
                                            </p>
                                            {affiliation.message && (
                                                <p className="text-sm text-gray-700 mt-1 italic">"{affiliation.message}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleAccept(affiliation.id)}
                                            className="p-2 btn btn-primary btn-sm"
                                            title="Accetta"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleReject(affiliation.id)}
                                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                            title="Rifiuta"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleBlock(affiliation.id)}
                                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                            title="Blocca agente"
                                        >
                                            <Ban size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Agente affiliato */}
            {acceptedAffiliations.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Il tuo agente</h4>
                    {acceptedAffiliations.map((affiliation) => (
                        <div
                            key={affiliation.id}
                            className="p-4 bg-brand-50 border border-brand-200 rounded-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Link href={`/profile/${affiliation.agent?.id}`}>
                                        {affiliation.agent?.avatarUrl ? (
                                            <img
                                                src={affiliation.agent.avatarUrl}
                                                alt="Agent"
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-semibold">
                                                {affiliation.agent?.firstName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </Link>
                                    <div>
                                        <p className="text-sm text-gray-600">Rappresentato da</p>
                                        <Link
                                            href={`/profile/${affiliation.agent?.id}`}
                                            className="font-semibold text-gray-900 hover:text-[#2341F0] transition"
                                        >
                                            {affiliation.agent?.firstName} {affiliation.agent?.lastName}
                                        </Link>
                                        {affiliation.affiliatedAt && (
                                            <p className="text-xs text-gray-500">
                                                Dal {new Date(affiliation.affiliatedAt).toLocaleDateString('it-IT')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(affiliation.id)}
                                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                                >
                                    Rimuovi
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
