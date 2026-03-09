/**
 * API Route: /api/groups
 * GET  ?userId=U           → list groups for user
 * POST { name, creatorId, memberIds[] } → create group
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return withCors(NextResponse.json([], { status: 200 }))

    const { data: memberRows, error } = await supabaseServer
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .is('deleted_at', null)

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))

    const groupIds = (memberRows || []).map((r: any) => r.group_id)
    if (!groupIds.length) return withCors(NextResponse.json([]))

    const { data: groups, error: grpErr } = await supabaseServer
        .from('group_conversations')
        .select('*')
        .in('id', groupIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (grpErr) return withCors(NextResponse.json({ error: grpErr.message }, { status: 500 }))

    // For each group get last message + unread count
    const result = await Promise.all((groups || []).map(async (g: any) => {
        const { data: lastMsgs } = await supabaseServer
            .from('group_messages')
            .select('id, content, sender_id, created_at, is_deleted_for_all, profiles:sender_id(first_name, last_name)')
            .eq('group_id', g.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)

        const { count: unread } = await supabaseServer
            .from('group_messages')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', g.id)
            .is('deleted_at', null)
            .not('id', 'in', `(select group_message_id from group_message_reads where user_id = '${userId}')`)

        const { count: memberCount } = await supabaseServer
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id)
            .is('deleted_at', null)

        const lastMsg = lastMsgs?.[0]
        const sender = lastMsg?.profiles as any
        const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : ''

        return {
            id: g.id,
            name: g.name,
            avatarUrl: g.avatar_url ?? null,
            memberCount: memberCount ?? 0,
            createdAt: g.created_at,
            isGroup: true,
            unread: unread ?? 0,
            lastMessage: lastMsg ? {
                id: lastMsg.id,
                senderName,
                text: lastMsg.is_deleted_for_all ? null : lastMsg.content,
                timestamp: lastMsg.created_at,
            } : null,
        }
    }))

    return withCors(NextResponse.json(result))
}

export async function POST(req: Request) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    let body: any
    try { body = await req.json() } catch { return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 })) }

    const name = (body.name || '').toString().trim()
    const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds : []

    if (!name) return withCors(NextResponse.json({ error: 'name required' }, { status: 400 }))
    if (memberIds.length < 1) return withCors(NextResponse.json({ error: 'at least 1 member required' }, { status: 400 }))

    const { data: group, error: grpErr } = await supabaseServer
        .from('group_conversations')
        .insert({ name, created_by: authenticatedUserId })
        .select()
        .single()

    if (grpErr) return withCors(NextResponse.json({ error: grpErr.message }, { status: 500 }))

    const allMembers = Array.from(new Set([authenticatedUserId, ...memberIds]))
    const memberRows = allMembers.map(uid => ({
        group_id: group.id,
        user_id: uid,
        role: uid === authenticatedUserId ? 'admin' : 'member',
    }))

    const { error: membErr } = await supabaseServer.from('group_members').insert(memberRows)
    if (membErr) return withCors(NextResponse.json({ error: membErr.message }, { status: 500 }))

    return withCors(NextResponse.json({ id: group.id, name: group.name, createdAt: group.created_at }, { status: 201 }))
}
