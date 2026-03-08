'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getAuthHeaders } from '@/lib/auth-fetch'

type StudioReviewFormProps = {
    studioId: string
    onSuccess?: () => void
}

function StarIcon({ filled, onClick }: { filled: boolean; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 w-8 transition ${onClick ? 'cursor-pointer hover:scale-110' : ''}`}
        >
            <svg className={`h-full w-full ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </button>
    )
}

export default function StudioReviewForm({ studioId, onSuccess }: StudioReviewFormProps) {
    const { user, isLoading: authLoading } = useAuth()
    const [isActiveClient, setIsActiveClient] = useState(false)
    const [hasExistingReview, setHasExistingReview] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')

    const [rating, setRating] = useState(0)
    const [title, setTitle] = useState('')
    const [comment, setComment] = useState('')

    useEffect(() => {
        async function checkPermission() {
            if (authLoading || !user) {
                setLoading(false)
                return
            }

            try {
                // Check if user is active client
                const authHeaders = await getAuthHeaders()
                const clientsRes = await fetch(`/api/studios/${studioId}/clients`, {
                    credentials: 'include',
                    headers: authHeaders,
                })

                if (clientsRes.ok) {
                    const clients = await clientsRes.json()
                    const isActive = clients.some(
                        (client: any) => client.clientProfileId === user.id && client.status === 'active'
                    )
                    setIsActiveClient(isActive)
                }

                // Check if user already has a review
                const reviewsRes = await fetch(`/api/studios/${studioId}/reviews`)
                if (reviewsRes.ok) {
                    const reviews = await reviewsRes.json()
                    const hasReview = reviews.some((review: any) => review.reviewerProfile.id === user.id)
                    setHasExistingReview(hasReview)
                }
            } catch (error) {
                console.error('Errore durante la verifica dei permessi:', error)
            } finally {
                setLoading(false)
            }
        }

        checkPermission()
    }, [studioId, user, authLoading])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/reviews`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    rating,
                    title: title.trim() || null,
                    comment: comment.trim() || null,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile inviare la recensione')
                return
            }

            setMessage('✅ Recensione inviata con successo!')
            setRating(0)
            setTitle('')
            setComment('')
            setHasExistingReview(true)
            onSuccess?.()
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-gray-600">Caricamento...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
                <p className="text-yellow-800">
                    🔒 <strong>Accedi</strong> per lasciare una recensione.
                </p>
            </div>
        )
    }

    if (hasExistingReview) {
        return (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <p className="text-blue-800">
                    ℹ️ Hai già inviato una recensione per questo studio.
                </p>
            </div>
        )
    }

    if (!isActiveClient) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-red-800">
                    ⚠️ <strong>Solo i clienti attivi</strong> possono lasciare una recensione per questo studio.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Lascia una recensione</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">Valutazione *</span>
                    </label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} filled={star <= rating} onClick={() => setRating(star)} />
                        ))}
                    </div>
                </div>

                {/* Title */}
                <label className="form-control">
                    <span className="label-text mb-1 block font-semibold">Titolo (opzionale)</span>
                    <input
                        type="text"
                        className="input input-bordered"
                        placeholder="Es. Ottimo studio professionale"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                    />
                </label>

                {/* Comment */}
                <label className="form-control">
                    <span className="label-text mb-1 block font-semibold">Commento (opzionale)</span>
                    <textarea
                        className="textarea textarea-bordered"
                        rows={5}
                        placeholder="Condividi la tua esperienza..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                    />
                </label>

                <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
                    {submitting ? 'Invio in corso...' : 'Invia Recensione'}
                </button>

                {message && (
                    <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    )
}
