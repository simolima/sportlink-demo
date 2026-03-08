'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type Review = {
    id: string
    rating: number
    title: string | null
    comment: string | null
    isVerified: boolean
    isPublished: boolean
    createdAt: string
    reviewerProfile: {
        id: string
        firstName: string
        lastName: string
        avatarUrl: string | null
    }
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

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento recensioni...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Recensioni</h1>
                <p className="mt-1 text-sm text-gray-600">Modera le recensioni lasciate dai clienti.</p>
            </div>

            {reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    Nessuna recensione.
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="flex items-start gap-4">
                                <img
                                    src={review.reviewerProfile.avatarUrl || '/avatars/default-avatar.jpg'}
                                    alt={`${review.reviewerProfile.firstName} ${review.reviewerProfile.lastName}`}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">
                                            {review.reviewerProfile.firstName} {review.reviewerProfile.lastName}
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
                                        <div className="font-semibold text-gray-800 mb-1">{review.title}</div>
                                    )}
                                    {review.comment && (
                                        <div className="text-sm text-gray-600 mb-2">{review.comment}</div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString('it-IT', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Moderation Actions */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${review.isPublished ? 'btn-warning' : 'btn-success'}`}
                                    onClick={() => handleTogglePublished(review.id, review.isPublished)}
                                >
                                    {review.isPublished ? '👁️ Nascondi' : '👁️ Pubblica'}
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${review.isVerified ? 'btn-outline' : 'btn-info'}`}
                                    onClick={() => handleToggleVerified(review.id, review.isVerified)}
                                >
                                    {review.isVerified ? '✓ Verificata' : '✓ Verifica'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-error btn-outline"
                                    onClick={() => handleDelete(review.id)}
                                >
                                    🗑️ Elimina
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
        </section>
    )
}
