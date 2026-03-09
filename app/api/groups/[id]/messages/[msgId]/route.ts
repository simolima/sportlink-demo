/**
 * API Route: /api/groups/[id]/messages/[msgId]
 * PATCH { newText }                        → edit (15-min window, sender only)
 * PATCH { scope: 'for_all' }              → delete for all (sender only)
 * PATCH { scope: 'for_me', userId }       → delete for me
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

const EDIT_WINDOW_MS = 15 * 60 * 1000

export async function OPTIONS() {
    return handleOptions()
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string; msgId: string } }
) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const { msgId } = params
    const body = await req.json()

    const { data: msg, error: fetchErr } = await supabaseServer
        .from('group_messages')
        .select('id, sender_id, created_at, is_deleted_for_all')
        .eq('id', msgId)
        .is('deleted_at', null)
        .single()

    if (fetchErr || !msg) return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }))

    // --- EDIT ---
    if (body.newText !== undefined) {
        const newText = body.newText.toString().trim()
        if (!newText) return withCors(NextResponse.json({ error: 'newText required' }, { status: 400 }))
        if (msg.sender_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))
        }
        const elapsed = Date.now() - new Date(msg.created_at).getTime()
        if (elapsed > EDIT_WINDOW_MS) {
            return withCors(NextResponse.json({ error: 'edit_window_expired' }, { status: 403 }))
        }
        const { data: updated, error: updErr } = await supabaseServer
            .from('group_messages')
            .update({ content: newText, edited_at: new Date().toISOString() })
            .eq('id', msgId)
            .select()
            .single()
        if (updErr) return withCors(NextResponse.json({ error: updErr.message }, { status: 500 }))
        return withCors(NextResponse.json({ id: updated.id, text: updated.content, editedAt: updated.edited_at }))
    }

    // --- DELETE FOR ALL ---
    if (body.scope === 'for_all') {
        if (msg.sender_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))
        }
        await supabaseServer.from('group_messages').update({ is_deleted_for_all: true }).eq('id', msgId)
        return withCors(NextResponse.json({ ok: true }))
    }

    // --- DELETE FOR ME ---
    if (body.scope === 'for_me') {
        await supabaseServer.from('group_message_hidden_for').upsert({
            user_id: authenticatedUserId,
            group_message_id: msgId,
        })
        return withCors(NextResponse.json({ ok: true }))
    }

    return withCors(NextResponse.json({ error: 'unrecognized PATCH mode' }, { status: 400 }))
}
