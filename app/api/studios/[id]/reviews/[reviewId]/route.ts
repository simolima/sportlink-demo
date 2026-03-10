export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// PATCH /api/studios/[id]/reviews/[reviewId]
// - Cliente (autore): aggiorna rating/title/comment della propria recensione
// - Owner studio: modera isPublished/isVerified
export async function PATCH(req: Request, { params }: { params: { id: string; reviewId: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const { data: review } = await supabase
            .from('studio_reviews')
            .select('id, studio_id, reviewer_profile_id')
            .eq('id', params.reviewId)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .single()

        if (!review) {
            return withCors(NextResponse.json({ error: 'review not found' }, { status: 404 }))
        }

        const isOwner = String(studio.owner_id) === String(authenticatedUserId)
        const isReviewer = String(review.reviewer_profile_id) === String(authenticatedUserId)

        if (!isOwner && !isReviewer) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const updates: Record<string, any> = {}
        let reviewerEdited = false

        // Reviewer fields
        if (isReviewer) {
            if (body.rating !== undefined) {
                const rating = Number(body.rating)
                if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                    return withCors(NextResponse.json({ error: 'rating_must_be_integer_between_1_and_5' }, { status: 400 }))
                }
                updates.rating = rating
                reviewerEdited = true
            }

            if (body.title !== undefined) {
                const title = body.title?.toString?.()?.trim() || null
                updates.title = title
                reviewerEdited = true
            }

            if (body.comment !== undefined) {
                const comment = body.comment?.toString?.()?.trim() || ''
                if (!comment) {
                    return withCors(NextResponse.json({ error: 'comment_required' }, { status: 400 }))
                }
                updates.comment = comment
                reviewerEdited = true
            }

            if (reviewerEdited) {
                updates.is_verified = false
            }
        }

        // Owner moderation fields
        if (isOwner) {
            if (body.isPublished !== undefined) {
                updates.is_published = !!body.isPublished
            }
            if (body.isVerified !== undefined) {
                updates.is_verified = !!body.isVerified
            }
            if (body.ownerResponse !== undefined) {
                const normalizedResponse = body.ownerResponse?.toString?.()?.trim() || ''
                if (normalizedResponse.length > 500) {
                    return withCors(NextResponse.json({ error: 'owner_response_too_long_max_500' }, { status: 400 }))
                }

                updates.owner_response = normalizedResponse || null
                updates.owner_responded_at = normalizedResponse ? new Date().toISOString() : null
            }
        }

        if (Object.keys(updates).length === 0) {
            return withCors(NextResponse.json({ error: 'no_valid_fields_to_update' }, { status: 400 }))
        }

        const { data: updated, error } = await supabase
            .from('studio_reviews')
            .update(updates)
            .eq('id', params.reviewId)
            .eq('studio_id', params.id)
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: updated.id,
            studioId: updated.studio_id,
            reviewerProfileId: updated.reviewer_profile_id,
            rating: updated.rating,
            title: updated.title,
            comment: updated.comment,
            isVerified: updated.is_verified,
            isPublished: updated.is_published,
            ownerResponse: updated.owner_response ?? undefined,
            ownerRespondedAt: updated.owner_responded_at ?? undefined,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/studios/[id]/reviews/[reviewId]
// - Autore recensione o owner studio (soft-delete)
export async function DELETE(req: Request, { params }: { params: { id: string; reviewId: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const { data: review } = await supabase
            .from('studio_reviews')
            .select('id, reviewer_profile_id')
            .eq('id', params.reviewId)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .single()

        if (!review) {
            return withCors(NextResponse.json({ error: 'review not found' }, { status: 404 }))
        }

        const isOwner = String(studio.owner_id) === String(authenticatedUserId)
        const isReviewer = String(review.reviewer_profile_id) === String(authenticatedUserId)

        if (!isOwner && !isReviewer) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const { error } = await supabase
            .from('studio_reviews')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', params.reviewId)
            .eq('studio_id', params.id)

        if (error) throw error

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
