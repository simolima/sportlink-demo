/**
 * API Route: /api/club-join-requests
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.club_join_requests
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/club-join-requests?clubId=X&userId=Y&status=Z
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const clubId = searchParams.get('clubId')
        const userId = searchParams.get('userId')
        const status = searchParams.get('status')

        let query = supabaseServer
            .from('club_join_requests')
            .select(`
                *,
                user:user_id (id, first_name, last_name, avatar_url, role_id),
                club:club_id (id, name, logo_url)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (clubId) query = query.eq('club_id', clubId)
        if (userId) query = query.eq('user_id', userId)
        if (status) query = query.eq('status', status)

        const { data, error } = await query

        if (error) {
            console.error('GET /api/club-join-requests error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        const enriched = (data || []).map((r: any) => ({
            id: r.id,
            clubId: r.club_id,
            userId: r.user_id,
            requestedRole: r.requested_role,
            requestedPosition: r.requested_position_id || '',
            message: r.message || '',
            status: r.status,
            requestedAt: r.created_at,
            respondedAt: r.responded_at,
            respondedBy: r.responded_by,
            user: r.user ? {
                id: r.user.id,
                firstName: r.user.first_name,
                lastName: r.user.last_name,
                avatarUrl: r.user.avatar_url,
                professionalRole: r.user.role_id,
            } : null,
            club: r.club ? {
                id: r.club.id,
                name: r.club.name,
                logoUrl: r.club.logo_url,
            } : null,
        }))

        return withCors(NextResponse.json(enriched))
    } catch (err) {
        console.error('GET /api/club-join-requests exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/club-join-requests — Create request
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { clubId, userId, requestedRole, requestedPosition, message } = body

        if (!clubId || !userId || !requestedRole) {
            return withCors(NextResponse.json({ error: 'clubId, userId, and requestedRole required' }, { status: 400 }))
        }

        // Check existing pending request
        const { data: existing } = await supabaseServer
            .from('club_join_requests')
            .select('id')
            .eq('club_id', clubId)
            .eq('user_id', userId)
            .eq('status', 'pending')
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Request already pending' }, { status: 400 }))
        }

        const { data, error } = await supabaseServer
            .from('club_join_requests')
            .insert({
                club_id: clubId,
                user_id: userId,
                requested_role: requestedRole,
                requested_position_id: requestedPosition || null,
                message: message || '',
                status: 'pending',
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/club-join-requests error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            id: data.id,
            clubId: data.club_id,
            userId: data.user_id,
            status: data.status,
            requestedAt: data.created_at,
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/club-join-requests exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// PUT /api/club-join-requests — Update status (accept/reject)
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, status, respondedBy } = body

        if (!id || !status) {
            return withCors(NextResponse.json({ error: 'id and status required' }, { status: 400 }))
        }

        const updateData: Record<string, any> = {
            status,
            responded_at: new Date().toISOString(),
        }
        if (respondedBy) updateData.responded_by = respondedBy

        const { data, error } = await supabaseServer
            .from('club_join_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('PUT /api/club-join-requests error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            id: data.id,
            status: data.status,
            respondedAt: data.responded_at,
        }))
    } catch (err) {
        console.error('PUT /api/club-join-requests exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE /api/club-join-requests?id=X
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const { error } = await supabaseServer
        .from('club_join_requests')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('DELETE /api/club-join-requests error:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withCors(NextResponse.json({ success: true }))
}
