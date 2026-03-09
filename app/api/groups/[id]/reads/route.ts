/**
 * API Route: /api/groups/[id]/reads
 * POST { userId, messageIds[] } → batch upsert read receipts
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const body = await req.json()
    const messageIds: string[] = Array.isArray(body.messageIds) ? body.messageIds : []
    if (!messageIds.length) return withCors(NextResponse.json({ ok: true, inserted: 0 }))

    const rows = messageIds.map(id => ({
        group_message_id: id,
        user_id: authenticatedUserId,
    }))

    const { error } = await supabaseServer
        .from('group_message_reads')
        .upsert(rows, { onConflict: 'group_message_id,user_id' })

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ ok: true, inserted: rows.length }))
}
