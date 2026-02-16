/**
 * API Route: /api/club-join-requests/accept
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Accepts a join request and creates the club membership.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { requestId, respondedBy } = body

        if (!requestId) {
            return withCors(NextResponse.json({ error: 'requestId required' }, { status: 400 }))
        }

        // Get the request
        const { data: joinReq, error: fetchErr } = await supabaseServer
            .from('club_join_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchErr || !joinReq) {
            return withCors(NextResponse.json({ error: 'Request not found' }, { status: 404 }))
        }

        if (joinReq.status !== 'pending') {
            return withCors(NextResponse.json({ error: 'Request is not pending' }, { status: 400 }))
        }

        // Update request status to accepted
        const { error: updateErr } = await supabaseServer
            .from('club_join_requests')
            .update({
                status: 'accepted',
                responded_at: new Date().toISOString(),
                responded_by: respondedBy || null,
            })
            .eq('id', requestId)

        if (updateErr) {
            console.error('Accept request update error:', updateErr)
            return withCors(NextResponse.json({ error: updateErr.message }, { status: 500 }))
        }

        // Check if already a member
        const { data: existingMember } = await supabaseServer
            .from('club_memberships')
            .select('id')
            .eq('club_id', joinReq.club_id)
            .eq('user_id', joinReq.user_id)
            .eq('status', 'active')
            .is('deleted_at', null)
            .maybeSingle()

        if (existingMember) {
            return withCors(NextResponse.json({ success: true, alreadyMember: true }))
        }

        // Create membership
        const { data: membership, error: memberErr } = await supabaseServer
            .from('club_memberships')
            .insert({
                club_id: joinReq.club_id,
                user_id: joinReq.user_id,
                club_role: joinReq.requested_role || 'Player',
                position_id: joinReq.requested_position_id || null,
                permissions: [],
                status: 'active',
            })
            .select()
            .single()

        if (memberErr) {
            console.error('Create membership error:', memberErr)
            return withCors(NextResponse.json({ error: memberErr.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            success: true,
            membership: {
                id: membership.id,
                clubId: membership.club_id,
                userId: membership.user_id,
                role: membership.club_role,
                joinedAt: membership.joined_at,
            },
        }))
    } catch (err) {
        console.error('POST /api/club-join-requests/accept exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}
