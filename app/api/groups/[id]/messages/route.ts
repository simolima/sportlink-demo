/**
 * API Route: /api/groups/[id]/messages
 * GET  ?userId=U  → paginated messages with reactions, read status
 * POST { senderId, text, replyToId?, forwardFromId? } → send group message
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

const SENDER_COLORS = [
    '#3B52F5', '#E84B4B', '#16A34A', '#D97706',
    '#7C3AED', '#0891B2', '#DB2777', '#65A30D',
]
function colorForUser(userId: string) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
    return SENDER_COLORS[hash % SENDER_COLORS.length]
}

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const groupId = params.id
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const before = url.searchParams.get('before') // cursor (timestamp ISO)

    let query = supabaseServer
        .from('group_messages')
        .select(`
            *,
            reply:reply_to_id(id, content, sender_id, is_deleted_for_all,
                reply_sender:sender_id(first_name, last_name)),
            profiles:sender_id(first_name, last_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit)

    if (before) query = query.lt('created_at', before)

    const { data: messages, error } = await query
    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))

    // Hidden for me
    const hiddenIds = new Set<string>()
    if (userId) {
        const { data: hiddenRows } = await supabaseServer
            .from('group_message_hidden_for')
            .select('group_message_id')
            .eq('user_id', userId)
            ; (hiddenRows || []).forEach((r: any) => hiddenIds.add(r.group_message_id))
    }

    // Reactions
    const msgIds = (messages || []).map((m: any) => m.id)
    let reactionsMap: Record<string, any[]> = {}
    if (msgIds.length && userId) {
        const { data: reactionsData } = await supabaseServer
            .from('group_message_reactions')
            .select('group_message_id, reaction, user_id, profiles:user_id(first_name, last_name)')
            .in('group_message_id', msgIds)
        if (reactionsData) reactionsMap = buildReactionsMap(reactionsData, 'group_message_id', userId)
    }

    // Read-by counts
    let readsMap: Record<string, number> = {}
    if (msgIds.length) {
        const { data: readsData } = await supabaseServer
            .from('group_message_reads')
            .select('group_message_id, user_id')
            .in('group_message_id', msgIds)
            ; (readsData || []).forEach((r: any) => {
                readsMap[r.group_message_id] = (readsMap[r.group_message_id] || 0) + 1
            })
    }

    // First unread
    let firstUnreadMessageId: string | null = null
    if (userId) {
        const firstUnread = (messages || []).find(
            (m: any) => !hiddenIds.has(m.id) && m.sender_id !== userId && !readsMap[m.id]
        )
        firstUnreadMessageId = firstUnread?.id ?? null
    }

    const mapped = (messages || [])
        .filter((m: any) => !hiddenIds.has(m.id))
        .map((m: any) => {
            const profile = m.profiles as any
            const sender = profile
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : 'Utente'
            const replyRaw = m.reply
            return {
                id: m.id,
                groupId: m.group_id,
                senderId: m.sender_id,
                senderName: sender,
                senderColor: colorForUser(m.sender_id),
                text: m.is_deleted_for_all ? null : m.content,
                timestamp: m.created_at,
                editedAt: m.edited_at ?? null,
                isDeletedForAll: m.is_deleted_for_all ?? false,
                forwardedFrom: !!m.forwarded_from_id,
                replyTo: replyRaw ? {
                    id: replyRaw.id,
                    senderName: replyRaw.reply_sender
                        ? `${replyRaw.reply_sender.first_name || ''} ${replyRaw.reply_sender.last_name || ''}`.trim()
                        : 'Utente',
                    text: replyRaw.is_deleted_for_all ? null : replyRaw.content,
                } : undefined,
                reactions: reactionsMap[m.id] ?? [],
                readCount: readsMap[m.id] ?? 0,
            }
        })

    return withCors(NextResponse.json({ messages: mapped, firstUnreadMessageId }))
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const groupId = params.id

    // Verify membership
    const { data: membership } = await supabaseServer
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', authenticatedUserId)
        .is('deleted_at', null)
        .single()
    if (!membership) return withCors(NextResponse.json({ error: 'not_a_member' }, { status: 403 }))

    const body = await req.json()
    const text = (body.text || '').toString().trim()
    if (!text) return withCors(NextResponse.json({ error: 'text required' }, { status: 400 }))

    const { data: msg, error } = await supabaseServer
        .from('group_messages')
        .insert({
            group_id: groupId,
            sender_id: authenticatedUserId,
            content: text,
            reply_to_id: body.replyToId || null,
            forwarded_from_id: body.forwardFromId || null,
        })
        .select()
        .single()

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))

    // Mark as read for sender
    await supabaseServer.from('group_message_reads').upsert({
        group_message_id: msg.id,
        user_id: authenticatedUserId,
    })

    return withCors(NextResponse.json({
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        senderColor: colorForUser(authenticatedUserId),
        text: msg.content,
        timestamp: msg.created_at,
        editedAt: null,
        isDeletedForAll: false,
        forwardedFrom: false,
        reactions: [],
        readCount: 1,
    }, { status: 201 }))
}

function buildReactionsMap(rows: any[], idField: string, viewerUserId: string) {
    const map: Record<string, Record<string, { count: number; users: any[]; hasMyReaction: boolean }>> = {}
    for (const row of rows) {
        const msgId = row[idField]
        const reaction = row.reaction
        if (!map[msgId]) map[msgId] = {}
        if (!map[msgId][reaction]) map[msgId][reaction] = { count: 0, users: [], hasMyReaction: false }
        map[msgId][reaction].count++
        const profile = row.profiles || {}
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utente'
        map[msgId][reaction].users.push({ userId: row.user_id, name })
        if (row.user_id === viewerUserId) map[msgId][reaction].hasMyReaction = true
    }
    const result: Record<string, any[]> = {}
    for (const msgId of Object.keys(map)) {
        result[msgId] = Object.entries(map[msgId]).map(([type, data]) => ({ type, ...data }))
    }
    return result
}
