/**
 * API Route: /api/messages
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.messages (id uuid, sender_id, receiver_id, content, is_read, created_at, deleted_at)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/messages
// Mode 1: ?userId=U&peerId=P  → conversation thread (ordered asc)
// Mode 2: ?userId=U           → list of conversations (last message + unread count)
export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const peerId = url.searchParams.get('peerId')

    try {
        // Mode 1: conversation thread
        if (userId && peerId) {
            const { data, error } = await supabaseServer
                .from('messages')
                .select('*')
                .is('deleted_at', null)
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`
                )
                .order('created_at', { ascending: true })

            if (error) {
                console.error('GET messages thread error:', error)
                return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            }

            const mapped = (data || []).map(mapMessage)
            return withCors(NextResponse.json(mapped))
        }

        // Mode 2: conversations list
        if (userId) {
            // Get all messages involving this user
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

            // Group by peer
            const convoMap: Record<string, { peerId: string; lastMessage: any; unread: number }> = {}

            for (const m of data || []) {
                const peer = m.sender_id === userId ? m.receiver_id : m.sender_id
                if (!convoMap[peer]) {
                    convoMap[peer] = { peerId: peer, lastMessage: mapMessage(m), unread: 0 }
                }
                // Keep most recent as lastMessage (already sorted desc)
                // Count unread (received by userId and not read)
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

        // No params — return empty for safety
        return withCors(NextResponse.json([]))
    } catch (err) {
        console.error('GET /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/messages — Send message
// Body: { senderId, receiverId, text }
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const senderId = body.senderId?.toString().trim()
        const receiverId = body.receiverId?.toString().trim()
        const text = (body.text || '').toString().trim()

        if (!senderId || !receiverId || !text) {
            return withCors(NextResponse.json({ error: 'senderId, receiverId, text required' }, { status: 400 }))
        }

        const { data: newMsg, error } = await supabaseServer
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                content: text,
                is_read: false,
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/messages error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Create notification for the receiver
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
                metadata: {
                    fromUserId: senderId,
                    fromUserName: senderName,
                    conversationId: senderId,
                    messageId: newMsg.id,
                },
                is_read: false,
            })
        } catch (notifErr) {
            console.error('Message notification failed:', notifErr)
        }

        return withCors(NextResponse.json(mapMessage(newMsg), { status: 201 }))
    } catch (err) {
        console.error('POST /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}

// PATCH /api/messages — Mark messages as read
// Body: { userId, peerId } → mark all from peer as read
// or    { ids: [...] }     → mark specific messages
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const ids: string[] = Array.isArray(body.ids) ? body.ids : []
        const userId = body.userId?.toString() || null
        const peerId = body.peerId?.toString() || null

        if (ids.length > 0) {
            const { data, error } = await supabaseServer
                .from('messages')
                .update({ is_read: true })
                .in('id', ids)
                .eq('is_read', false)
                .select('id')

            if (error) {
                console.error('PATCH messages by ids error:', error)
                return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            }

            return withCors(NextResponse.json({ updated: data?.length || 0 }))
        }

        if (userId && peerId) {
            const { data, error } = await supabaseServer
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', peerId)
                .eq('receiver_id', userId)
                .eq('is_read', false)
                .select('id')

            if (error) {
                console.error('PATCH messages by peer error:', error)
                return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
            }

            return withCors(NextResponse.json({ updated: data?.length || 0 }))
        }

        return withCors(NextResponse.json({ error: 'provide ids[] or userId+peerId' }, { status: 400 }))
    } catch (err) {
        console.error('PATCH /api/messages exception:', err)
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}

// Helper: map DB row to frontend-compatible shape
function mapMessage(m: any) {
    return {
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        text: m.content,
        timestamp: m.created_at,
        read: m.is_read,
    }
}
