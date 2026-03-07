/**
 * API Route: Initiate Google Calendar OAuth flow
 * 
 * GET /api/studios/[id]/google-auth/initiate
 * 
 * Generates OAuth authorization URL for user to consent to Google Calendar access.
 * Returns URL to redirect user's browser to.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'
import { generateAuthUrl } from '@/lib/google-oauth-service'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const studioId = params.id

        // 1. Verify authenticated user
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        // 2. Verify user owns this studio
        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return withCors(NextResponse.json({ error: 'studio_not_found' }, { status: 404 }))
        }

        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden_not_owner' }, { status: 403 }))
        }

        // 3. Check if connection already exists
        const { data: existingConnection } = await supabaseServer
            .from('google_calendar_connections')
            .select('id')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (existingConnection) {
            return withCors(
                NextResponse.json(
                    { error: 'connection_already_exists', message: 'Disconnect existing connection first' },
                    { status: 409 }
                )
            )
        }

        // 4. Generate OAuth URL (state = studioId for CSRF protection)
        const authUrl = generateAuthUrl(studioId)

        return withCors(NextResponse.json({ authUrl }))
    } catch (error: any) {
        console.error('Error initiating Google OAuth:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
