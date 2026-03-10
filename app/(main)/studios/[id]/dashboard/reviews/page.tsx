'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type Review = {
    id: string
    rating: number
    title: string | null
    comment: string | null
    isVerified: boolean
    isPublished: boolean
    ownerResponse?: string
    ownerRespondedAt?: string
    createdAt: string
    reviewer?: {
        id: string
        firstName: string
        lastName: string
        avatarUrl: string | null
    }
    reviewerProfile?: {
        id: string
        firstName: string
        lastName: string
        avatarUrl: string | null
    }
}

const REVIEW_FILTERS = ['all', 'published', 'hidden', 'verified', 'to_verify'] as const
type ReviewFilter = (typeof REVIEW_FILTERS)[number]

const FILTER_LABELS: Record<ReviewFilter, string> = {
    all: 'Tutte',
    published: 'Pubblicate',
    hidden: 'Nascoste',
    verified: 'Verificate',
    to_verify: 'Da verificare',
}

function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    )
}

export default function StudioDashboardReviewsPage() {
    const params = useParams()
    const studioId = params.id as string

    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [filter, setFilter] = useState<ReviewFilter>('all')
    const [editingResponseReviewId, setEditingResponseReviewId] = useState<string | null>(null)
    const [responseDraft, setResponseDraft] = useState('')
    const [savingResponseReviewId, setSavingResponseReviewId] = useState<string | null>(null)

    useEffect(() => {
        async function loadReviews() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/reviews?includeUnpublished=true`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                setReviews(await res.json())
            }
            setLoading(false)
        }

        loadReviews()
    }, [studioId])

    const visibleReviews = useMemo(() => {
        if (filter === 'all') return reviews
        if (filter === 'published') return reviews.filter((review) => review.isPublished)
        if (filter === 'hidden') return reviews.filter((review) => !review.isPublished)
        if (filter === 'verified') return reviews.filter((review) => review.isVerified)
        return reviews.filter((review) => !review.isVerified)
    }, [reviews, filter])

    const handleTogglePublished = async (reviewId: string, currentValue: boolean) => {
        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/reviews/${reviewId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify({ isPublished: !currentValue }),
        })

        if (res.ok) {
            setReviews((prev) =>
                prev.map((r) => (r.id === reviewId ? { ...r, isPublished: !currentValue } : r))
            )
            setMessage(`Recensione ${!currentValue ? 'pubblicata' : 'nascosta'} con successo`)
        } else {
            const data = await res.json()
            setMessage(data.error || 'Errore durante l\'aggiornamento')
        }
    }

    const handleToggleVerified = async (reviewId: string, currentValue: boolean) => {
        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/reviews/${reviewId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify({ isVerified: !currentValue }),
        })

        if (res.ok) {
            setReviews((prev) =>
                prev.map((r) => (r.id === reviewId ? { ...r, isVerified: !currentValue } : r))
            )
            setMessage(`Recensione ${!currentValue ? 'verificata' : 'non verificata'}`)
        } else {
            const data = await res.json()
            setMessage(data.error || 'Errore durante l\'aggiornamento')
        }
    }

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return

        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/reviews/${reviewId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
        })

        if (res.ok) {
            setReviews((prev) => prev.filter((r) => r.id !== reviewId))
            setMessage('Recensione eliminata con successo')
        } else {
            const data = await res.json()
            setMessage(data.error || 'Impossibile eliminare la recensione')
        }
    }

    const startResponseEditing = (review: Review) => {
        setEditingResponseReviewId(review.id)
        setResponseDraft(review.ownerResponse || '')
        setMessage('')
    }

    const handleSaveOwnerResponse = async (reviewId: string) => {
        const trimmed = responseDraft.trim()
        if (trimmed.length > 500) {
            setMessage('La risposta dello studio non puo superare i 500 caratteri')
            return
        }

        setSavingResponseReviewId(reviewId)
        setMessage('')
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/reviews/${reviewId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ ownerResponse: trimmed || null }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile salvare la risposta')
                return
            }

            setReviews((prev) => prev.map((review) => (
                review.id === reviewId
                    ? {
                        ...review,
                        ownerResponse: data.ownerResponse,
                        ownerRespondedAt: data.ownerRespondedAt,
                    }
                    : review
            )))
            setEditingResponseReviewId(null)
            setResponseDraft('')
            setMessage(trimmed ? 'Risposta dello studio salvata' : 'Risposta dello studio rimossa')
        } finally {
            setSavingResponseReviewId(null)
        }
    }

    const countByFilter = (targetFilter: ReviewFilter) => {
        if (targetFilter === 'all') return reviews.length
        if (targetFilter === 'published') return reviews.filter((r) => r.isPublished).length
        if (targetFilter === 'hidden') return reviews.filter((r) => !r.isPublished).length
        if (targetFilter === 'verified') return reviews.filter((r) => r.isVerified).length
        return reviews.filter((r) => !r.isVerified).length
    }

    const filterDescription = () => {
        if (filter === 'all') return 'Mostra tutte le recensioni'
        if (filter === 'published') return 'Mostra solo recensioni pubblicate'
        if (filter === 'hidden') return 'Mostra solo recensioni nascoste'
        if (filter === 'verified') return 'Mostra solo recensioni verificate'
        return 'Mostra solo recensioni da verificare'
    }

    if (loading) {
        return <div className="glass-widget rounded-2xl p-6">Caricamento recensioni...</div>
    }

    return (
        <section className="space-y-5 glass-widget rounded-2xl p-6">
            <div>
                <h1 className="text-2xl font-bold text-base-content">Recensioni</h1>
                <p className="mt-1 text-sm text-secondary">Modera le recensioni lasciate dai clienti.</p>
            </div>

            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {REVIEW_FILTERS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`btn btn-sm ${filter === item ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter(item)}
                        >
                            {FILTER_LABELS[item]} ({countByFilter(item)})
                        </button>
                    ))}
                </div>
                <p className="text-xs text-secondary">{filterDescription()}</p>
            </div>

            {reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center text-secondary">
                    Nessuna recensione.
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleReviews.length === 0 && (
                        <div className="rounded-lg border border-base-300 bg-base-100 p-4 text-sm text-secondary">
                            Nessuna recensione corrisponde ai filtri selezionati.
                        </div>
                    )}

                    {visibleReviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                            {(() => {
                                const reviewer = review.reviewer ?? review.reviewerProfile
                                const avatarUrl = reviewer?.avatarUrl || '/avatars/default-avatar.jpg'
                                const reviewerName = reviewer
                                    ? `${reviewer.firstName} ${reviewer.lastName}`
                                    : 'Cliente verificato'

                                return (
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={avatarUrl}
                                            alt={reviewerName}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-base-content">
                                                    {reviewerName}
                                                </span>
                                                {review.isVerified && (
                                                    <span className="badge badge-sm badge-success">✓ Verificata</span>
                                                )}
                                                {!review.isPublished && (
                                                    <span className="badge badge-sm badge-warning">Nascosta</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIcon key={star} filled={star <= review.rating} />
                                                ))}
                                            </div>
                                            {review.title && (
                                                <div className="font-semibold text-base-content mb-1">{review.title}</div>
                                            )}
                                            {review.comment && (
                                                <div className="text-sm text-secondary mb-2">{review.comment}</div>
                                            )}
                                            <div className="text-xs text-secondary">
                                                {new Date(review.createdAt).toLocaleDateString('it-IT', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </div>

                                            {review.ownerResponse && (
                                                <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
                                                    <p className="text-xs font-semibold text-primary">Risposta dello studio</p>
                                                    <p className="mt-1 text-sm text-base-content">{review.ownerResponse}</p>
                                                    {review.ownerRespondedAt && (
                                                        <p className="mt-1 text-xs text-secondary">
                                                            Aggiornata il {new Date(review.ownerRespondedAt).toLocaleDateString('it-IT', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}

                            {editingResponseReviewId === review.id ? (
                                <div className="mt-4 rounded-lg border border-base-300 bg-base-200 p-3">
                                    <label className="block text-xs font-medium text-secondary mb-2">
                                        Risposta dello studio (max 500 caratteri)
                                    </label>
                                    <textarea
                                        value={responseDraft}
                                        onChange={(e) => setResponseDraft(e.target.value)}
                                        className="textarea textarea-bordered w-full"
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Scrivi una risposta professionale alla recensione"
                                    />
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-secondary">{responseDraft.length}/500</span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleSaveOwnerResponse(review.id)}
                                                disabled={savingResponseReviewId === review.id}
                                            >
                                                {savingResponseReviewId === review.id ? 'Salvataggio...' : 'Salva risposta'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => {
                                                    setEditingResponseReviewId(null)
                                                    setResponseDraft('')
                                                }}
                                                disabled={savingResponseReviewId === review.id}
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-ghost"
                                        onClick={() => startResponseEditing(review)}
                                    >
                                        {review.ownerResponse ? 'Modifica risposta' : 'Aggiungi risposta'}
                                    </button>
                                </div>
                            )}

                            {/* Moderation Actions */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${review.isPublished ? 'btn-warning' : 'btn-success'}`}
                                    onClick={() => handleTogglePublished(review.id, review.isPublished)}
                                >
                                    {review.isPublished ? 'Nascondi' : 'Pubblica'}
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${review.isVerified ? 'btn-outline' : 'btn-info'}`}
                                    onClick={() => handleToggleVerified(review.id, review.isVerified)}
                                >
                                    {review.isVerified ? 'Verificata' : 'Verifica'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-error btn-outline"
                                    onClick={() => handleDelete(review.id)}
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {message && <p className="text-sm text-secondary mt-4">{message}</p>}
        </section>
    )
}
