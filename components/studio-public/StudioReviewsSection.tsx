"use client"

import { FormEvent, useMemo, useState } from 'react'
import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/lib/hooks/useAuth'
import { getAuthHeaders } from '@/lib/auth-fetch'

interface Review {
    id: string
    rating: number
    title?: string
    comment: string
    isVerified?: boolean
    ownerResponse?: string
    ownerRespondedAt?: string
    createdAt: string
    reviewer?: {
        id: string
        firstName: string
        lastName: string
        avatarUrl?: string
    }
}

interface Props {
    studioId: string
    reviews: Review[]
    onUpdated?: () => void
}

export default function StudioReviewsSection({ studioId, reviews, onUpdated }: Props) {
    const { user } = useAuth()
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
    const [editRating, setEditRating] = useState(0)
    const [editTitle, setEditTitle] = useState('')
    const [editComment, setEditComment] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

    const editableReviewIds = useMemo(
        () => new Set(reviews.filter((r) => r.reviewer && String(r.reviewer.id) === String(user?.id)).map((r) => r.id)),
        [reviews, user?.id]
    )

    if (!reviews || reviews.length === 0) return null

    // Calcolo rating medio
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    const useHorizontalScroll = reviews.length > 4

    const startEditing = (review: Review) => {
        setEditingReviewId(review.id)
        setEditRating(review.rating)
        setEditTitle(review.title || '')
        setEditComment(review.comment || '')
        setSaveError('')
    }

    const handleSaveEdit = async (e: FormEvent) => {
        e.preventDefault()
        if (!editingReviewId) return

        setSaveError('')
        setIsSaving(true)
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/reviews/${editingReviewId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    rating: editRating,
                    title: editTitle.trim() || null,
                    comment: editComment.trim(),
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setSaveError(data.error || 'Impossibile aggiornare la recensione')
                return
            }

            setEditingReviewId(null)
            onUpdated?.()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="py-16 bg-base-100">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-base-content mb-2">Recensioni</h2>
                    <div className="w-16 h-1 bg-brand-600 rounded-full mb-4 mx-auto" />
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon
                                    key={i}
                                    className={`h-6 w-6 ${i < Math.round(Number(avgRating)) ? 'text-yellow-500' : 'text-secondary/40'}`}
                                />
                            ))}
                        </div>
                        <span className="text-2xl font-bold text-base-content">{avgRating}</span>
                        <span className="text-secondary">({reviews.length} recensioni)</span>
                    </div>
                </div>

                {useHorizontalScroll ? (
                    <div className="-mx-4 px-4 overflow-x-auto pb-2">
                        <div className="flex gap-6 min-w-max snap-x snap-mandatory">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-base-200 p-6 rounded-xl border border-base-300 hover:shadow-md transition-shadow w-[320px] shrink-0 snap-start"
                                >
                                    {editingReviewId === review.id ? (
                                        <form onSubmit={handleSaveEdit} className="space-y-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setEditRating(star)}
                                                        className="p-0.5"
                                                    >
                                                        <StarIcon className={`h-5 w-5 ${star <= editRating ? 'text-yellow-500' : 'text-secondary/40'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="input input-bordered w-full"
                                                placeholder="Titolo (opzionale)"
                                                maxLength={100}
                                            />
                                            <textarea
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                className="textarea textarea-bordered w-full"
                                                rows={4}
                                                maxLength={1000}
                                                required
                                            />
                                            {saveError && <p className="text-sm text-error">{saveError}</p>}
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={isSaving || editRating < 1 || !editComment.trim()}
                                                >
                                                    {isSaving ? 'Salvataggio...' : 'Salva'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingReviewId(null)}
                                                    className="btn btn-ghost btn-sm"
                                                    disabled={isSaving}
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            {/* Rating + Verified */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500' : 'text-secondary/40'}`}
                                                        />
                                                    ))}
                                                </div>
                                                {review.isVerified && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
                                                        <span className="text-xs text-primary font-medium">Verificata</span>
                                                    </div>
                                                )}
                                            </div>

                                            {review.title && <p className="font-semibold text-base-content mb-2">{review.title}</p>}

                                            {/* Testo recensione */}
                                            <p className="text-secondary leading-relaxed mb-4 text-sm">"{review.comment}"</p>

                                            {review.ownerResponse && (
                                                <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
                                                    <p className="text-xs font-semibold text-primary">Risposta dello studio</p>
                                                    <p className="mt-1 text-sm text-base-content">{review.ownerResponse}</p>
                                                </div>
                                            )}

                                            {/* Autore e data */}
                                            <div className="flex items-center justify-between text-xs text-secondary">
                                                <span className="font-medium">
                                                    {review.reviewer
                                                        ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                                                        : 'Cliente verificato'}
                                                </span>
                                                <span>{new Date(review.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' })}</span>
                                            </div>

                                            {editableReviewIds.has(review.id) && (
                                                <div className="mt-3 pt-3 border-t border-base-300">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(review)}
                                                        className="btn btn-ghost btn-xs"
                                                    >
                                                        Modifica recensione
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-base-200 p-6 rounded-xl border border-base-300 hover:shadow-md transition-shadow w-full max-w-sm md:max-w-[320px]"
                            >
                                {editingReviewId === review.id ? (
                                    <form onSubmit={handleSaveEdit} className="space-y-3">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setEditRating(star)}
                                                    className="p-0.5"
                                                >
                                                    <StarIcon className={`h-5 w-5 ${star <= editRating ? 'text-yellow-500' : 'text-secondary/40'}`} />
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="input input-bordered w-full"
                                            placeholder="Titolo (opzionale)"
                                            maxLength={100}
                                        />
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            className="textarea textarea-bordered w-full"
                                            rows={4}
                                            maxLength={1000}
                                            required
                                        />
                                        {saveError && <p className="text-sm text-error">{saveError}</p>}
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm"
                                                disabled={isSaving || editRating < 1 || !editComment.trim()}
                                            >
                                                {isSaving ? 'Salvataggio...' : 'Salva'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingReviewId(null)}
                                                className="btn btn-ghost btn-sm"
                                                disabled={isSaving}
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500' : 'text-secondary/40'}`}
                                                    />
                                                ))}
                                            </div>
                                            {review.isVerified && (
                                                <div className="flex items-center gap-1">
                                                    <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
                                                    <span className="text-xs text-primary font-medium">Verificata</span>
                                                </div>
                                            )}
                                        </div>
                                        {review.title && <p className="font-semibold text-base-content mb-2">{review.title}</p>}
                                        <p className="text-secondary leading-relaxed mb-4 text-sm">"{review.comment}"</p>
                                        {review.ownerResponse && (
                                            <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
                                                <p className="text-xs font-semibold text-primary">Risposta dello studio</p>
                                                <p className="mt-1 text-sm text-base-content">{review.ownerResponse}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-secondary">
                                            <span className="font-medium">
                                                {review.reviewer
                                                    ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                                                    : 'Cliente verificato'}
                                            </span>
                                            <span>{new Date(review.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' })}</span>
                                        </div>
                                        {editableReviewIds.has(review.id) && (
                                            <div className="mt-3 pt-3 border-t border-base-300">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(review)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    Modifica recensione
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
