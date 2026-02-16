/**
 * API Route: /api/club-memberships
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.club_memberships (id uuid, club_id, user_id, club_role, permissions, position_id, joined_at, status, created_at, deleted_at)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/club-memberships?clubId=X&userId=Y
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const clubId = searchParams.get('clubId')
        const userId = searchParams.get('userId')

        let query = supabaseServer
            .from('club_memberships')
            .select(`
                *,
                club:club_id (id, name, logo_url, sport_ids),
                user:user_id (id, first_name, last_name, avatar_url, role_id)
            `)
            .eq('status', 'active')
            .is('deleted_at', null)

        if (clubId) {
            query = query.eq('club_id', clubId)
        }
        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query.order('joined_at', { ascending: false })

        if (error) {
            console.error('GET /api/club-memberships error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Map to frontend format
        const enriched = (data || []).map((m: any) => ({
            id: m.id,
            clubId: m.club_id,
            userId: m.user_id,
            role: m.club_role,
            position: m.position_id || '',
            permissions: m.permissions || [],
            joinedAt: m.joined_at,
            isActive: m.status === 'active',
            club: m.club ? {
                id: m.club.id,
                name: m.club.name,
                logoUrl: m.club.logo_url,
                sports: m.club.sport_ids || [],
            } : null,
            user: m.user ? {
                id: m.user.id,
                firstName: m.user.first_name,
                lastName: m.user.last_name,
                avatarUrl: m.user.avatar_url,
                professionalRole: m.user.role_id,
            } : null,
        }))

        return withCors(NextResponse.json(enriched))
    } catch (err) {
        console.error('GET /api/club-memberships exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/club-memberships — Add member
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { clubId, userId, role, position, permissions } = body

        if (!clubId || !userId || !role) {
            return withCors(NextResponse.json({ error: 'clubId, userId, and role required' }, { status: 400 }))
        }

        // Check if already an active member
        const { data: existing } = await supabaseServer
            .from('club_memberships')
            .select('id')
            .eq('club_id', clubId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'User is already a member of this club' }, { status: 400 }))
        }

        const { data, error } = await supabaseServer
            .from('club_memberships')
            .insert({
                club_id: clubId,
                user_id: userId,
                club_role: role,
                position_id: position || null,
                permissions: permissions || [],
                status: 'active',
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/club-memberships error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            id: data.id,
            clubId: data.club_id,
            userId: data.user_id,
            role: data.club_role,
            joinedAt: data.joined_at,
            isActive: data.status === 'active',
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/club-memberships exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// PUT /api/club-memberships — Update membership
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, role, position, permissions, isActive } = body

        if (!id) {
            return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
        }

        const updateData: Record<string, any> = {}
        if (role !== undefined) updateData.club_role = role
        if (position !== undefined) updateData.position_id = position || null
        if (permissions !== undefined) updateData.permissions = permissions
        if (isActive !== undefined) updateData.status = isActive ? 'active' : 'past'

        const { data, error } = await supabaseServer
            .from('club_memberships')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('PUT /api/club-memberships error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data))
    } catch (err) {
        console.error('PUT /api/club-memberships exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE /api/club-memberships?id=X
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    // Soft delete
    const { error } = await supabaseServer
        .from('club_memberships')
        .update({ status: 'past', deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('DELETE /api/club-memberships error:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withCors(NextResponse.json({ success: true }))
}
