/**
 * API Route: /api/needs
 * Migrated — 15/02/2026
 *
 * No dedicated table in Supabase yet. Uses opportunities table as a proxy
 * or returns empty. This is a future-feature stub.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(req: Request) {
    // Stub: needs are not stored yet in Supabase
    // For the MVP, return a generated ID
    const body = await req.json().catch(() => ({}))

    return withCors(NextResponse.json({
        id: crypto.randomUUID(),
        sport: body.sport || '',
        position: body.position || null,
        ageMin: body.ageMin || null,
        ageMax: body.ageMax || null,
        level: body.level || null,
        createdAt: new Date().toISOString(),
    }))
}
