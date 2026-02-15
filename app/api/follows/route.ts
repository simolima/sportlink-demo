/**
 * API Route: /api/follows
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.follows (follower_id, following_id, created_at, deleted_at)
 * Also creates notifications in public.notifications on new follow.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/follows?followerId=XXX | followingId=YYY
export async function GET(req: Request) {
    const url = new URL(req.url)
    const followerId = url.searchParams.get('followerId')
    const followingId = url.searchParams.get('followingId')

    try {
        let query = supabaseServer
            .from('follows')
            .select('*')
            .is('deleted_at', null)

        if (followerId) {
            query = query.eq('follower_id', followerId)
        }
        if (followingId) {
            query = query.eq('following_id', followingId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('GET /api/follows error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Map to camelCase for frontend compatibility
        const mapped = (data || []).map((f: any) => ({
            followerId: f.follower_id,
            followingId: f.following_id,
            createdAt: f.created_at,
        }))

        return withCors(NextResponse.json(mapped))
    } catch (err) {
        console.error('GET /api/follows exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST body: { followerId, followingId }
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const followerId = body.followerId?.toString().trim()
        const followingId = body.followingId?.toString().trim()

        if (!followerId || !followingId) {
            return withCors(NextResponse.json({ error: 'followerId_and_followingId_required' }, { status: 400 }))
        }
        if (followerId === followingId) {
            return withCors(NextResponse.json({ error: 'cannot_follow_self' }, { status: 400 }))
        }

        // Check if already following
        const { data: existing } = await supabaseServer
            .from('follows')
            .select('follower_id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'already_following' }, { status: 409 }))
        }

        // Upsert to handle soft-deleted rows being re-followed
        const { data: newFollow, error } = await supabaseServer
            .from('follows')
            .upsert(
                { follower_id: followerId, following_id: followingId, created_at: new Date().toISOString(), deleted_at: null },
                { onConflict: 'follower_id,following_id' }
            )
            .select()
            .single()

        if (error) {
            console.error('POST /api/follows error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Create notification for the followed user
        try {
            const { data: followerProfile } = await supabaseServer
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', followerId)
                .single()

            if (followerProfile) {
                const followerName = `${followerProfile.first_name || ''} ${followerProfile.last_name || ''}`.trim() || 'Un utente'

                await supabaseServer.from('notifications').insert({
                    user_id: followingId,
                    type: 'new_follower',
                    title: 'Nuovo follower',
                    message: `${followerName} ha iniziato a seguirti.`,
                    metadata: {
                        followerId: followerProfile.id,
                        followerName,
                        followerAvatar: followerProfile.avatar_url || null,
                    },
                    is_read: false,
                })
            }
        } catch (notifErr) {
            console.error('Follow notification failed:', notifErr)
        }

        return withCors(NextResponse.json({
            followerId: newFollow.follower_id,
            followingId: newFollow.following_id,
            createdAt: newFollow.created_at,
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/follows exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE body: { followerId, followingId }
export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const followerId = body.followerId?.toString().trim()
        const followingId = body.followingId?.toString().trim()

        if (!followerId || !followingId) {
            return withCors(NextResponse.json({ error: 'followerId_and_followingId_required' }, { status: 400 }))
        }

        // Hard delete (follows PK is composite, re-follow is upsert above)
        const { error } = await supabaseServer
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId)

        if (error) {
            console.error('DELETE /api/follows error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ removed: 1 }))
    } catch (err) {
        console.error('DELETE /api/follows exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}
