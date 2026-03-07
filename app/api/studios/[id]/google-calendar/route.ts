/**
 * API Route: Google Calendar Connection Management
 * 
 * GET    /api/studios/[id]/google-calendar - Get connection status
 * PATCH  /api/studios/[id]/google-calendar - Select calendar & setup watch channel
 * DELETE /api/studios/[id]/google-calendar - Disconnect & revoke access
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'
import { revokeAccess, decryptToken } from '@/lib/google-oauth-service'
import { setupWatchChannel, stopWatchChannel } from '@/lib/google-calendar-service'

export async function OPTIONS() {
    return handleOptions()
}

/**
 * GET - Fetch connection status
 * 
 * Returns:
 * - connected: boolean
 * - selectedCalendar: { id, name } | null
 * - lastSynced: ISO string | null
 * - watchChannelExpires: ISO string | null
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id

        // 1. Verify authenticated user owns studio
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio || studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        // 2. Fetch connection
        const { data: connection, error } = await supabaseServer
            .from('google_calendar_connections')
            .select('selected_calendar_id, selected_calendar_name, last_synced_at, watch_expires_at')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (error || !connection) {
            return withCors(
                NextResponse.json({
                    connected: false,
                    selectedCalendar: null,
                    lastSynced: null,
                    watchChannelExpires: null,
                })
            )
        }

        return withCors(
            NextResponse.json({
                connected: true,
                selectedCalendar: connection.selected_calendar_id
                    ? {
                        id: connection.selected_calendar_id,
                        name: connection.selected_calendar_name || 'Unknown',
                    }
                    : null,
                lastSynced: connection.last_synced_at,
                watchChannelExpires: connection.watch_expires_at,
            })
        )
    } catch (error: any) {
        console.error('Error fetching connection status:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * PATCH - Select calendar and setup watch channel
 * 
 * Body: { calendarId: string, calendarName: string }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const body = await req.json()
        const { calendarId, calendarName } = body

        if (!calendarId) {
            return withCors(NextResponse.json({ error: 'calendar_id_required' }, { status: 400 }))
        }

        // 1. Verify authenticated user owns studio
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio || studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        // 2. Update selected calendar
        const { error: updateError } = await supabaseServer
            .from('google_calendar_connections')
            .update({
                selected_calendar_id: calendarId,
                selected_calendar_name: calendarName || calendarId,
            })
            .eq('professional_studio_id', studioId)

        if (updateError) {
            throw new Error(`Failed to update calendar: ${updateError.message}`)
        }

        // 3. Setup watch channel for push notifications
        try {
            const watchChannel = await setupWatchChannel(studioId)
            console.log(`✅ Watch channel setup for studio ${studioId}:`, watchChannel)
        } catch (watchError: any) {
            console.error('Watch channel setup failed (non-blocking):', watchError.message)
            // Non-blocking - calendar selection still successful
        }

        return withCors(
            NextResponse.json({
                success: true,
                selectedCalendar: { id: calendarId, name: calendarName || calendarId },
            })
        )
    } catch (error: any) {
        console.error('Error selecting calendar:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * DELETE - Disconnect Google Calendar and revoke access
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id

        // 1. Verify authenticated user owns studio
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio || studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        // 2. Get connection
        const { data: connection } = await supabaseServer
            .from('google_calendar_connections')
            .select('encrypted_refresh_token')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (!connection) {
            return withCors(NextResponse.json({ error: 'connection_not_found' }, { status: 404 }))
        }

        // 3. Stop watch channel (if active)
        try {
            await stopWatchChannel(studioId)
        } catch (error: any) {
            console.error('Stop watch channel failed (non-blocking):', error.message)
        }

        // 4. Revoke Google OAuth access
        try {
            const refreshToken = decryptToken(connection.encrypted_refresh_token)
            await revokeAccess(refreshToken)
        } catch (error: any) {
            console.error('Token revocation failed (non-blocking):', error.message)
        }

        // 5. Delete connection from database
        const { error: deleteError } = await supabaseServer
            .from('google_calendar_connections')
            .delete()
            .eq('professional_studio_id', studioId)

        if (deleteError) {
            throw new Error(`Failed to delete connection: ${deleteError.message}`)
        }

        // 6. Delete cached external events
        await supabaseServer
            .from('studio_external_events')
            .delete()
            .eq('professional_studio_id', studioId)

        console.log(`✅ Google Calendar disconnected for studio ${studioId}`)

        return withCors(NextResponse.json({ success: true, message: 'Disconnected successfully' }))
    } catch (error: any) {
        console.error('Error disconnecting Google Calendar:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
