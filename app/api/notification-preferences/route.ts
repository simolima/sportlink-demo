/**
 * API Route: /api/notification-preferences
 * Updated: 2026-03-08 — persists to notification_preferences table.
 *
 * GET  /api/notification-preferences?userId={id}  — read preferences (with DB fallback to defaults)
 * POST /api/notification-preferences              — upsert preferences (JWT-verified)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { DEFAULT_PREFERENCES } from '@/lib/notifications-repository'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/notification-preferences?userId={id}
export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
        return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))
    }

    const { data, error } = await supabaseServer
        .from('notification_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    const preferences = data?.preferences
        ? { ...DEFAULT_PREFERENCES, ...(data.preferences as Record<string, boolean>) }
        : { ...DEFAULT_PREFERENCES }

    return withCors(NextResponse.json({ userId: String(userId), preferences }))
}

// POST /api/notification-preferences — upsert user preferences
export async function POST(req: Request) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId) {
        return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
    }

    const body = await req.json()
    const { userId, preferences } = body

    if (!userId) {
        return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))
    }

    if (String(userId) !== authenticatedUserId) {
        return withCors(NextResponse.json({ error: 'forbidden_user_mismatch' }, { status: 403 }))
    }

    const merged = { ...DEFAULT_PREFERENCES, ...(preferences || {}) }

    const { error } = await supabaseServer
        .from('notification_preferences')
        .upsert(
            { user_id: authenticatedUserId, preferences: merged, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        )

    if (error) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withCors(NextResponse.json({ userId: authenticatedUserId, preferences: merged }))
}
