/**
 * API Route: /api/messages/[id]/reactions
 * POST { userId, reaction } → toggle reaction on a 1:1 message
 * GET                       → list all reactions for this message
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

const VALID_REACTIONS = ['like', 'love', 'fire', 'trophy', 'zap', 'star'] as const

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const messageId = params.id
    const { data, error } = await supabaseServer
        .from('message_reactions')
        .select('reaction, user_id, profiles:user_id(first_name, last_name)')
        .eq('message_id', messageId)

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json(data || []))
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const messageId = params.id
    const body = await req.json()
    const reaction = body.reaction as string

    if (!VALID_REACTIONS.includes(reaction as any)) {
        return withCors(NextResponse.json({ error: 'invalid_reaction' }, { status: 400 }))
    }

    // Check if reaction already exists (toggle)
    const { data: existing } = await supabaseServer
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', authenticatedUserId)
        .eq('reaction', reaction)
        .maybeSingle()

    if (existing) {
        await supabaseServer.from('message_reactions').delete().eq('id', existing.id)
        return withCors(NextResponse.json({ toggled: 'removed' }))
    }

    const { error } = await supabaseServer
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: authenticatedUserId, reaction })

    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json({ toggled: 'added' }, { status: 201 }))
}
