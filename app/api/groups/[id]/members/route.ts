/**
 * API Route: /api/groups/[id]/members
 * GET              → list members
 * POST { userId, role? }  → add member (admin only)
 * PATCH { userId, role }  → update role (admin only)
 * DELETE { userId }       → remove member (admin) or leave (self)
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

async function isAdmin(groupId: string, userId: string) {
    const { data } = await supabaseServer
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single()
    return data?.role === 'admin'
}

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const { data, error } = await supabaseServer
        .from('group_members')
        .select('user_id, role, created_at, profiles:user_id(first_name, last_name, avatar_url)')
        .eq('group_id', params.id)
        .is('deleted_at', null)

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json((data || []).map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: m.created_at,
        firstName: m.profiles?.first_name ?? null,
        lastName: m.profiles?.last_name ?? null,
        avatarUrl: m.profiles?.avatar_url ?? null,
    }))))
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
    if (!await isAdmin(params.id, authenticatedUserId)) {
        return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
    }

    const body = await req.json()
    const userId = body.userId?.toString()
    const role = body.role === 'admin' ? 'admin' : 'member'
    if (!userId) return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))

    const { error } = await supabaseServer
        .from('group_members')
        .upsert({ group_id: params.id, user_id: userId, role, deleted_at: null })

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ ok: true }, { status: 201 }))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
    if (!await isAdmin(params.id, authenticatedUserId)) {
        return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
    }

    const body = await req.json()
    const userId = body.userId?.toString()
    const role = body.role === 'admin' ? 'admin' : 'member'
    if (!userId) return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))

    const { error } = await supabaseServer
        .from('group_members')
        .update({ role })
        .eq('group_id', params.id)
        .eq('user_id', userId)
        .is('deleted_at', null)

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ ok: true }))
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const body = await req.json()
    const targetUserId = body.userId?.toString() || authenticatedUserId

    // Can remove self always; can remove others only if admin
    if (targetUserId !== authenticatedUserId && !await isAdmin(params.id, authenticatedUserId)) {
        return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
    }

    await supabaseServer
        .from('group_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('group_id', params.id)
        .eq('user_id', targetUserId)

    return withCors(NextResponse.json({ ok: true }))
}
