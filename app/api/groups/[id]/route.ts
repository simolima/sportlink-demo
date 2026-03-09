/**
 * API Route: /api/groups/[id]
 * GET   → group metadata + members
 * PATCH { name?, avatarUrl? } → update group (admin only)
 * DELETE → soft delete group (admin only)
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

async function requireGroupAdmin(groupId: string, userId: string) {
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
    const groupId = params.id

    const { data: group, error } = await supabaseServer
        .from('group_conversations')
        .select('*')
        .eq('id', groupId)
        .is('deleted_at', null)
        .single()

    if (error || !group) return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }))

    const { data: members } = await supabaseServer
        .from('group_members')
        .select('user_id, role, created_at, profiles:user_id(first_name, last_name, avatar_url)')
        .eq('group_id', groupId)
        .is('deleted_at', null)

    const mappedMembers = (members || []).map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: m.created_at,
        firstName: m.profiles?.first_name ?? null,
        lastName: m.profiles?.last_name ?? null,
        avatarUrl: m.profiles?.avatar_url ?? null,
    }))

    return withCors(NextResponse.json({
        id: group.id,
        name: group.name,
        avatarUrl: group.avatar_url ?? null,
        createdBy: group.created_by,
        createdAt: group.created_at,
        members: mappedMembers,
    }))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const groupId = params.id
    const isAdmin = await requireGroupAdmin(groupId, authenticatedUserId)
    if (!isAdmin) return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))

    const body = await req.json()
    const updates: Record<string, any> = {}
    if (body.name !== undefined) updates['name'] = body.name.toString().trim()
    if (body.avatarUrl !== undefined) updates['avatar_url'] = body.avatarUrl

    if (!Object.keys(updates).length) return withCors(NextResponse.json({ error: 'no fields to update' }, { status: 400 }))

    const { data, error } = await supabaseServer
        .from('group_conversations')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single()

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ id: data.id, name: data.name, avatarUrl: data.avatar_url }))
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const groupId = params.id
    const isAdmin = await requireGroupAdmin(groupId, authenticatedUserId)
    if (!isAdmin) return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))

    await supabaseServer
        .from('group_conversations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', groupId)

    return withCors(NextResponse.json({ ok: true }))
}
