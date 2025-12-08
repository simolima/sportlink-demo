'use client'

import { useEffect, useState } from 'react'
import { Shield, Check, X, Ban, UserCircle } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'

interface Affiliation {
    id: number
    agentId: number
    playerId: number
    status: 'pending' | 'accepted' | 'rejected'
    requestedAt: string
    affiliatedAt?: string
    message?: string
    agent?: {
        id: number
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

interface PlayerRepresentationProps {
    playerId: number
    isOwnProfile: boolean
}

export default function PlayerRepresentation({ playerId, isOwnProfile }: PlayerRepresentationProps) {
    const { showToast } = useToast()
    const [affiliations, setAffiliations] = useState<Affiliation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAffiliations()
    }, [playerId])

    const fetchAffiliations = async () => {
        try {
            const res = await fetch(`/api/affiliations?playerId=${playerId}`)
            const data = await res.json()
            setAffiliations(data)
        } catch (error) {
            console.error('Error fetching affiliations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (affiliationId: number) => {
        try {
            const res = await fetch('/api/affiliations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: affiliationId,
                    status: 'accepted',
                }),
            })

            if (res.ok) {
                showToast('success', 'Affiliazione accettata!', "Hai accettato l'affiliazione con successo")
                fetchAffiliations()
            }
        } catch (error) {
            showToast('error', 'Errore', "Impossibile accettare l'affiliazione")
        }
    }

    const handleReject = async (affiliationId: number) => {
        try {
            const res = await fetch('/api/affiliations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: affiliationId,
                    status: 'rejected',
                }),
            })

            if (res.ok) {
                showToast('success', 'Richiesta rifiutata', 'La richiesta è stata rifiutata')
                fetchAffiliations()
            }
        } catch (error) {
            showToast('error', 'Errore', 'Impossibile rifiutare la richiesta')
        }
    }

    const handleBlock = async (affiliationId: number) => {
        if (!confirm("Sei sicuro di voler bloccare questo agente? Non potrà più inviarti richieste.")) {
            return
        }

        try {
            const res = await fetch(`/api/affiliations?id=${affiliationId}&block=true`, {
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

    const handleRemove = async (affiliationId: number) => {
        if (!confirm('Sei sicuro di voler rimuovere questa affiliazione?')) {
            return
        }

        try {
            const res = await fetch(`/api/affiliations?id=${affiliationId}`, {
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
    const acceptedAffiliations = affiliations.filter((a) => a.status === 'accepted')

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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2341F0] to-blue-600 flex items-center justify-center">
                                <UserCircle size={24} className="text-white" />
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
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2341F0] to-blue-600 flex items-center justify-center">
                                                    <UserCircle size={20} className="text-white" />
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
                            className="p-4 bg-green-50 border border-green-200 rounded-lg"
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
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2341F0] to-blue-600 flex items-center justify-center">
                                                <UserCircle size={24} className="text-white" />
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
