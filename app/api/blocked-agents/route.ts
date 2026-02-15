/**
 * API Route: /api/blocked-agents
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.blocks (blocker_id, blocked_id, created_at, deleted_at)
 *
 * This API wraps the generic blocks table for agent-blocking functionality.
 * - playerId  → blocker_id
 * - agentId   → blocked_id
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/blocked-agents?playerId=X&agentId=Y
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')

    try {
        let query = supabaseServer
            .from('blocks')
            .select('*')
            .is('deleted_at', null)

        if (playerId) {
            query = query.eq('blocker_id', playerId)
        }
        if (agentId) {
            query = query.eq('blocked_id', agentId)
        }

        const { data: blocks, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('GET /api/blocked-agents error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Enrich with profile data
        const enriched = await Promise.all(
            (blocks || []).map(async (b: any) => {
                const { data: player } = await supabaseServer
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url')
                    .eq('id', b.blocker_id)
                    .single()

                const { data: agent } = await supabaseServer
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url')
                    .eq('id', b.blocked_id)
                    .single()

                return {
                    playerId: b.blocker_id,
                    agentId: b.blocked_id,
                    blockedAt: b.created_at,
                    player: player ? {
                        id: player.id,
                        firstName: player.first_name,
                        lastName: player.last_name,
                        avatarUrl: player.avatar_url,
                    } : null,
                    agent: agent ? {
                        id: agent.id,
                        firstName: agent.first_name,
                        lastName: agent.last_name,
                        avatarUrl: agent.avatar_url,
                    } : null,
                }
            })
        )

        return withCors(NextResponse.json(enriched))
    } catch (err) {
        console.error('GET /api/blocked-agents exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/blocked-agents — Block an agent
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { playerId, agentId } = body

        if (!playerId || !agentId) {
            return withCors(NextResponse.json({ error: 'playerId and agentId required' }, { status: 400 }))
        }

        // Check if already blocked
        const { data: existing } = await supabaseServer
            .from('blocks')
            .select('blocker_id')
            .eq('blocker_id', playerId)
            .eq('blocked_id', agentId)
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Agent already blocked' }, { status: 400 }))
        }

        // Upsert (handles re-blocking after soft-delete)
        const { data, error } = await supabaseServer
            .from('blocks')
            .upsert(
                { blocker_id: playerId, blocked_id: agentId, created_at: new Date().toISOString(), deleted_at: null },
                { onConflict: 'blocker_id,blocked_id' }
            )
            .select()
            .single()

        if (error) {
            console.error('POST /api/blocked-agents error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            playerId: data.blocker_id,
            agentId: data.blocked_id,
            blockedAt: data.created_at,
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/blocked-agents exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE /api/blocked-agents?playerId=X&agentId=Y
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')

    if (!playerId || !agentId) {
        return withCors(NextResponse.json({ error: 'playerId and agentId required' }, { status: 400 }))
    }

    try {
        const { error } = await supabaseServer
            .from('blocks')
            .delete()
            .eq('blocker_id', playerId)
            .eq('blocked_id', agentId)

        if (error) {
            console.error('DELETE /api/blocked-agents error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (err) {
        console.error('DELETE /api/blocked-agents exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}
