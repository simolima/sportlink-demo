/**
 * API Route: /api/messages
 *
 * GET  ?userId=U&peerId=P  → conversation thread with replyTo, reactions, hidden filter
 * GET  ?userId=U           → conversations list with unread + firstUnreadMessageId
 * POST { senderId, receiverId, text, replyToId?, forwardFromId? } → send message
 * PATCH modes:
 *   { userId, peerId }                          → mark all from peer as read
 *   { ids: [...] }                               → mark specific messages as read
 *   { messageId, senderId, newText }             → edit message (15-min window)
 *   { messageId, userId, scope: 'for_all' }      → delete for everyone
 *   { messageId, userId, scope: 'for_me' }       → delete only for caller
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, validateUserIdFromBody, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function OPTIONS() {
    return handleOptions()
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const peerId = url.searchParams.get('peerId')

    try {
        // Mode 1: conversation thread
        if (userId && peerId) {
            const { data, error } = await supabaseServer
                .from('messages')
                .select(`
                    *,
                    reply:reply_to_id (
                        id, content, sender_id,
                        reply_sender:sender_id ( first_name, last_name )
                    )
                `)
                .is('deleted_at', null)
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`
                )
                .order('created_at', { ascending: true })

            if (error) {
                console.error('GET messages thread error:', error)
                return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            }

            // Fetch hidden-for-me ids
            const { data: hiddenRows } = await supabaseServer
                .from('message_hidden_for')
                .select('message_id')
                .eq('user_id', userId)

            const hiddenIds = new Set((hiddenRows || []).map((r: any) => r.message_id))

            // Fetch reactions for messages in this thread
            const messageIds = (data || []).map((m: any) => m.id)
            let reactionsMap: Record<string, any[]> = {}
            if (messageIds.length > 0) {
                const { data: reactionsData } = await supabaseServer
                    .from('message_reactions')
                    .select('message_id, reaction, user_id, profiles:user_id(first_name, last_name)')
                    .in('message_id', messageIds)
                reactionsMap = buildReactionsMap(reactionsData || [], 'message_id', userId)
            }

            const mapped = (data || [])
                .filter((m: any) => !hiddenIds.has(m.id))
                .map((m: any) => mapMessage(m, reactionsMap[m.id]))

            // Find first unread message (from peer, not read by userId)
            const firstUnread = (data || []).find(
                (m: any) => m.sender_id === peerId && !m.is_read && !hiddenIds.has(m.id)
            )

            return withCors(NextResponse.json({
                messages: mapped,
                firstUnreadMessageId: firstUnread?.id ?? null,
            }))
        }

        // Mode 2: conversations list
        if (userId) {
            const { data, error } = await supabaseServer
                .from('messages')
                .select('*')
                .is('deleted_at', null)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('GET conversations error:', error)
                return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            }

            // Fetch all hidden ids for this user
            const { data: hiddenRows } = await supabaseServer
                .from('message_hidden_for')
                .select('message_id')
                .eq('user_id', userId)
            const hiddenIds = new Set((hiddenRows || []).map((r: any) => r.message_id))

            const convoMap: Record<string, { peerId: string; lastMessage: any; unread: number }> = {}

            for (const m of data || []) {
                if (hiddenIds.has(m.id)) continue
                const peer = m.sender_id === userId ? m.receiver_id : m.sender_id
                if (!convoMap[peer]) {
                    convoMap[peer] = { peerId: peer, lastMessage: mapMessage(m, undefined), unread: 0 }
                }
                if (m.receiver_id === userId && !m.is_read) {
                    convoMap[peer].unread += 1
                }
            }

            const conversations = Object.values(convoMap)
            conversations.sort((a, b) =>
                new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
            )

            return withCors(NextResponse.json(conversations))
        }

        return withCors(NextResponse.json([]))
    } catch (err) {
        console.error('GET /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const body = await req.json()
        const senderId = body.senderId?.toString().trim()
        const receiverId = body.receiverId?.toString().trim()
        const text = (body.text || '').toString().trim()
        const replyToId = body.replyToId?.toString().trim() || null
        const forwardFromId = body.forwardFromId?.toString().trim() || null

        if (!senderId || !receiverId || !text) {
            return withCors(NextResponse.json({ error: 'senderId, receiverId, text required' }, { status: 400 }))
        }

        if (senderId !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))
        }

        const senderValidation = validateUserIdFromBody({ userId: senderId })
        if (!senderValidation.valid) {
            return withCors(NextResponse.json({ error: 'invalid_sender_id' }, { status: 400 }))
        }

        const receiverValidation = validateUserIdFromBody({ userId: receiverId })
        if (!receiverValidation.valid) {
            return withCors(NextResponse.json({ error: 'invalid_receiver_id' }, { status: 400 }))
        }

        const { data: newMsg, error } = await supabaseServer
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                content: text,
                is_read: false,
                reply_to_id: replyToId,
                forwarded_from_id: forwardFromId,
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/messages error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Notification
        try {
            const { data: sender } = await supabaseServer
                .from('profiles')
                .select('id, first_name, last_name')
                .eq('id', senderId)
                .single()

            const senderName = sender
                ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
                : 'Un utente'

            await supabaseServer.from('notifications').insert({
                user_id: receiverId,
                type: 'message_received',
                title: 'Nuovo messaggio ricevuto',
                message: `${senderName} ti ha inviato un nuovo messaggio`,
                metadata: { fromUserId: senderId, fromUserName: senderName, conversationId: senderId, messageId: newMsg.id },
                is_read: false,
            })
        } catch (notifErr) {
            console.error('Message notification failed:', notifErr)
        }

        return withCors(NextResponse.json(mapMessage(newMsg, undefined), { status: 201 }))
    } catch (err) {
        console.error('POST /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const body = await req.json()

        // --- Mode: EDIT message ---
        if (body.newText !== undefined && body.messageId) {
            const messageId = body.messageId.toString()
            const newText = body.newText.toString().trim()
            if (!newText) return withCors(NextResponse.json({ error: 'newText required' }, { status: 400 }))

            const { data: existing, error: fetchErr } = await supabaseServer
                .from('messages')
                .select('id, sender_id, created_at')
                .eq('id', messageId)
                .is('deleted_at', null)
                .single()

            if (fetchErr || !existing) return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }))
            if (existing.sender_id !== authenticatedUserId) {
                return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))
            }

            const elapsed = Date.now() - new Date(existing.created_at).getTime()
            if (elapsed > EDIT_WINDOW_MS) {
                return withCors(NextResponse.json({ error: 'edit_window_expired' }, { status: 403 }))
            }

            const { data: updated, error: updateErr } = await supabaseServer
                .from('messages')
                .update({ content: newText, edited_at: new Date().toISOString() })
                .eq('id', messageId)
                .select()
                .single()

            if (updateErr) return withCors(NextResponse.json({ error: updateErr.message }, { status: 500 }))
            return withCors(NextResponse.json(mapMessage(updated, undefined)))
        }

        // --- Mode: DELETE for everyone or for me ---
        if (body.scope === 'for_all' && body.messageId) {
            const messageId = body.messageId.toString()
            const { data: existing } = await supabaseServer
                .from('messages').select('sender_id').eq('id', messageId).single()
            if (!existing || existing.sender_id !== authenticatedUserId) {
                return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))
            }
            await supabaseServer.from('messages').update({ is_deleted_for_all: true }).eq('id', messageId)
            return withCors(NextResponse.json({ ok: true }))
        }

        if (body.scope === 'for_me' && body.messageId) {
            const messageId = body.messageId.toString()
            await supabaseServer.from('message_hidden_for').upsert({
                user_id: authenticatedUserId,
                message_id: messageId,
            })
            return withCors(NextResponse.json({ ok: true }))
        }

        // --- Mode: mark as read by ids ---
        const ids: string[] = Array.isArray(body.ids) ? body.ids : []
        if (ids.length > 0) {
            const { data: messagesToUpdate, error: fetchError } = await supabaseServer
                .from('messages').select('id, receiver_id').in('id', ids)
            if (fetchError) return withCors(NextResponse.json({ error: fetchError.message }, { status: 500 }))

            const allBelongToUser = messagesToUpdate?.every(msg => msg.receiver_id === authenticatedUserId)
            if (!allBelongToUser) {
                return withCors(NextResponse.json({ error: 'forbidden_cannot_mark_others_messages' }, { status: 403 }))
            }

            const { data, error } = await supabaseServer
                .from('messages').update({ is_read: true }).in('id', ids).eq('is_read', false).select('id')
            if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            return withCors(NextResponse.json({ updated: data?.length || 0 }))
        }

        // --- Mode: mark as read by peer ---
        const userId = body.userId?.toString() || null
        const peerId = body.peerId?.toString() || null

        if (userId && peerId) {
            if (userId !== authenticatedUserId) {
                return withCors(NextResponse.json({ error: 'forbidden_user_mismatch' }, { status: 403 }))
            }
            const { data, error } = await supabaseServer
                .from('messages').update({ is_read: true })
                .eq('sender_id', peerId).eq('receiver_id', userId).eq('is_read', false).select('id')
            if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            return withCors(NextResponse.json({ updated: data?.length || 0 }))
        }

        return withCors(NextResponse.json({ error: 'unrecognized PATCH mode' }, { status: 400 }))
    } catch (err) {
        console.error('PATCH /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapMessage(m: any, reactions?: any) {
    const replyRaw = m.reply
    return {
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        text: m.is_deleted_for_all ? null : m.content,
        timestamp: m.created_at,
        read: m.is_read,
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
        reactions: reactions ?? [],
    }
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
    // Convert to array format
    const result: Record<string, any[]> = {}
    for (const msgId of Object.keys(map)) {
        result[msgId] = Object.entries(map[msgId]).map(([type, data]) => ({ type, ...data }))
    }
    return result
}
