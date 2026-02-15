/**
 * API Route: /api/notification-preferences
 * Migrated from JSON — 15/02/2026
 *
 * For the MVP, notification preferences return defaults.
 * Future: store in a dedicated notification_preferences table or in profiles.privacy_settings JSONB.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'

const DEFAULT_PREFERENCES: Record<string, boolean> = {
    follower: true,
    messages: true,
    applications: true,
    affiliations: true,
    club: true,
    opportunities: true,
    permissions: true,
    profile: true
}

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

    // For MVP, always return defaults
    return withCors(NextResponse.json({
        userId: String(userId),
        preferences: DEFAULT_PREFERENCES,
    }))
}

// POST /api/notification-preferences
export async function POST(req: Request) {
    const body = await req.json()
    const { userId, preferences } = body

    if (!userId) {
        return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))
    }

    // For MVP, accept and echo back (no persistence yet)
    return withCors(NextResponse.json({
        userId: String(userId),
        preferences: { ...DEFAULT_PREFERENCES, ...(preferences || {}) },
    }))
}
