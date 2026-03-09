/**
 * API Route: /api/groups/[id]/messages/[msgId]/reactions
 * POST { reaction } → toggle reaction
 * GET               → list reactions
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

// Accept any non-empty string up to 100 chars (emoji or legacy type names)
const isValidReaction = (r: string) => typeof r === 'string' && r.trim().length > 0 && r.length <= 100

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(_req: Request, { params }: { params: { id: string; msgId: string } }) {
    const { data, error } = await supabaseServer
        .from('group_message_reactions')
        .select('reaction, user_id, profiles:user_id(first_name, last_name)')
        .eq('group_message_id', params.msgId)
    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json(data || []))
}

export async function POST(req: Request, { params }: { params: { id: string; msgId: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const body = await req.json()
    const reaction = (body.reaction as string || '').trim()
    if (!isValidReaction(reaction)) {
        return withCors(NextResponse.json({ error: 'invalid_reaction' }, { status: 400 }))
    }

    const { data: existing } = await supabaseServer
        .from('group_message_reactions')
        .select('id')
        .eq('group_message_id', params.msgId)
        .eq('user_id', authenticatedUserId)
        .eq('reaction', reaction)
        .maybeSingle()

    if (existing) {
        await supabaseServer.from('group_message_reactions').delete().eq('id', existing.id)
        return withCors(NextResponse.json({ toggled: 'removed' }))
    }

    const { error } = await supabaseServer
        .from('group_message_reactions')
        .insert({ group_message_id: params.msgId, user_id: authenticatedUserId, reaction })

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ toggled: 'added' }, { status: 201 }))
}
