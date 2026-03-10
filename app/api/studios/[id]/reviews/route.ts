export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id]/reviews
// - Owner: vede tutte le recensioni (anche non pubblicate)
// - Altri utenti: vedono recensioni pubblicate + eventuale propria recensione
export async function GET(req: Request, { params }: { params: { id: string } }) {
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

        const isOwner = studio.owner_id === authenticatedUserId

        const { data, error } = await supabase
            .from('studio_reviews')
            .select(`
                id, studio_id, reviewer_profile_id, rating, title, comment, is_verified, is_published,
                owner_response, owner_responded_at,
                created_at, updated_at, deleted_at,
                reviewer:profiles!reviewer_profile_id(
                    id, first_name, last_name, avatar_url
                )
            `)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (error) throw error

        const filtered = (data || []).filter((r: any) => {
            if (isOwner) return true
            return r.is_published || String(r.reviewer_profile_id) === String(authenticatedUserId)
        })

        const result = filtered.map((r: any) => ({
            id: r.id,
            studioId: r.studio_id,
            reviewerProfileId: r.reviewer_profile_id,
            rating: r.rating,
            title: r.title ?? undefined,
            comment: r.comment,
            isVerified: !!r.is_verified,
            isPublished: !!r.is_published,
            ownerResponse: r.owner_response ?? undefined,
            ownerRespondedAt: r.owner_responded_at ?? undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            reviewer: r.reviewer ? {
                id: r.reviewer.id,
                firstName: r.reviewer.first_name,
                lastName: r.reviewer.last_name,
                avatarUrl: r.reviewer.avatar_url,
            } : undefined,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/studios/[id]/reviews
// - Solo cliente attivo dello studio può inserire
// - Una sola recensione attiva per cliente per studio
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('id, owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const { data: activeClientLink } = await supabase
            .from('studio_clients')
            .select('id')
            .eq('studio_id', params.id)
            .eq('client_profile_id', authenticatedUserId)
            .eq('status', 'active')
            .is('deleted_at', null)
            .maybeSingle()

        const { data: completedAppointment } = await supabase
            .from('studio_appointments')
            .select('id')
            .eq('studio_id', params.id)
            .eq('client_id', authenticatedUserId)
            .eq('status', 'completed')
            .is('deleted_at', null)
            .maybeSingle()

        const canReview = !!activeClientLink || !!completedAppointment

        if (!canReview) {
            return withCors(NextResponse.json({ error: 'forbidden_not_active_client' }, { status: 403 }))
        }

        const body = await req.json()
        const rating = Number(body?.rating)
        const title = body?.title?.toString?.()?.trim() || null
        const comment = body?.comment?.toString?.()?.trim() || ''

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return withCors(NextResponse.json({ error: 'rating_must_be_integer_between_1_and_5' }, { status: 400 }))
        }

        if (!comment) {
            return withCors(NextResponse.json({ error: 'comment_required' }, { status: 400 }))
        }

        const { data: existing } = await supabase
            .from('studio_reviews')
            .select('id')
            .eq('studio_id', params.id)
            .eq('reviewer_profile_id', authenticatedUserId)
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'review_already_exists', reviewId: existing.id }, { status: 409 }))
        }

        const { data: inserted, error } = await supabase
            .from('studio_reviews')
            .insert({
                studio_id: params.id,
                reviewer_profile_id: authenticatedUserId,
                rating,
                title,
                comment,
                is_verified: false,
                is_published: true,
            })
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: inserted.id,
            studioId: inserted.studio_id,
            reviewerProfileId: inserted.reviewer_profile_id,
            rating: inserted.rating,
            title: inserted.title,
            comment: inserted.comment,
            isVerified: inserted.is_verified,
            isPublished: inserted.is_published,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
