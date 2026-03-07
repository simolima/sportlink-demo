/**
 * Google Calendar Service
 * 
 * Wrapper service for Google Calendar API v3 operations:
 * - Calendar list fetching
 * - FreeBusy queries (conflict detection)
 * - Event CRUD (create, update, delete)
 * - Incremental sync with sync token
 * - Watch channel setup for push notifications
 * 
 * All methods require a valid access token (automatically refreshed if expired).
 */

import { google, calendar_v3 } from 'googleapis'
import { supabaseServer } from './supabase-server'
import {
    decryptToken,
    encryptToken,
    refreshAccessToken,
    isTokenExpired,
} from './google-oauth-service'

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarListItem {
    id: string
    summary: string
    primary?: boolean
    accessRole: string // e.g., "owner", "writer", "reader"
}

export interface FreeBusySlot {
    start: string // ISO 8601 datetime
    end: string // ISO 8601 datetime
}

export interface GoogleCalendarEvent {
    id: string
    summary: string
    start: { dateTime?: string; date?: string }
    end: { dateTime?: string; date?: string }
    status?: string
}

export interface SyncResult {
    added: number
    updated: number
    deleted: number
    nextSyncToken: string
}

// ============================================================================
// CALENDAR API CLIENT
// ============================================================================

/**
 * Get authenticated Calendar API client with automatic token refresh
 * 
 * @param studioId - Professional studio ID
 * @returns Calendar API client instance
 * @throws Error if connection not found or token refresh fails
 */
async function getCalendarClient(studioId: string): Promise<calendar_v3.Calendar> {
    // 1. Fetch connection from database
    const { data: connection, error } = await supabaseServer
        .from('google_calendar_connections')
        .select('*')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    if (error || !connection) {
        throw new Error('Google Calendar not connected for this studio')
    }

    // 2. Decrypt tokens
    let accessToken = decryptToken(connection.encrypted_access_token)
    const refreshToken = decryptToken(connection.encrypted_refresh_token)
    const expiryDate = new Date(connection.token_expires_at).getTime()

    // 3. Check if token expired and refresh if needed
    if (isTokenExpired(expiryDate)) {
        console.log(`🔄 Access token expired for studio ${studioId}, refreshing...`)

        const refreshed = await refreshAccessToken(refreshToken)
        accessToken = refreshed.access_token

        // Save new access token to database
        const encryptedNewToken = encryptToken(accessToken)
        await supabaseServer
            .from('google_calendar_connections')
            .update({
                encrypted_access_token: encryptedNewToken,
                token_expires_at: new Date(refreshed.expiry_date).toISOString(),
            })
            .eq('professional_studio_id', studioId)
    }

    // 4. Create Calendar API client
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })

    return google.calendar({ version: 'v3', auth: oauth2Client })
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * List all calendars accessible by the authenticated user
 * 
 * @param studioId - Professional studio ID
 * @returns Array of calendar list items
 */
export async function listCalendars(studioId: string): Promise<CalendarListItem[]> {
    const calendar = await getCalendarClient(studioId)

    const response = await calendar.calendarList.list()

    return (response.data.items || []).map((item) => ({
        id: item.id!,
        summary: item.summary!,
        primary: item.primary || undefined,
        accessRole: item.accessRole!,
    }))
}

/**
 * Query FreeBusy information for conflict detection
 * 
 * Does NOT read event details - privacy-friendly approach per GDPR.
 * Returns only time ranges when calendar is busy.
 * 
 * @param studioId - Professional studio ID
 * @param calendarId - Google Calendar ID
 * @param timeMin - Start of time range (ISO 8601)
 * @param timeMax - End of time range (ISO 8601)
 * @returns Array of busy time slots
 */
export async function getFreeBusy(
    studioId: string,
    calendarId: string,
    timeMin: string,
    timeMax: string
): Promise<FreeBusySlot[]> {
    const calendar = await getCalendarClient(studioId)

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            items: [{ id: calendarId }],
        },
    })

    const busySlots = response.data.calendars?.[calendarId]?.busy || []

    return busySlots.map((slot) => ({
        start: slot.start!,
        end: slot.end!,
    }))
}

/**
 * Create event in Google Calendar
 * 
 * @param studioId - Professional studio ID
 * @param calendarId - Google Calendar ID
 * @param event - Event details
 * @returns Created event ID
 */
export async function createEvent(
    studioId: string,
    calendarId: string,
    event: {
        summary: string
        description?: string
        start: string // ISO 8601 datetime
        end: string // ISO 8601 datetime
        attendees?: { email: string }[]
    }
): Promise<string> {
    const calendar = await getCalendarClient(studioId)

    const response = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary: event.summary,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            attendees: event.attendees,
        },
    })

    return response.data.id!
}

/**
 * Update existing event in Google Calendar
 * 
 * @param studioId - Professional studio ID
 * @param calendarId - Google Calendar ID
 * @param eventId - Google event ID
 * @param event - Updated event details
 */
export async function updateEvent(
    studioId: string,
    calendarId: string,
    eventId: string,
    event: {
        summary?: string
        description?: string
        start?: string
        end?: string
        attendees?: { email: string }[]
    }
): Promise<void> {
    const calendar = await getCalendarClient(studioId)

    const updateBody: any = {}
    if (event.summary) updateBody.summary = event.summary
    if (event.description) updateBody.description = event.description
    if (event.start) updateBody.start = { dateTime: event.start }
    if (event.end) updateBody.end = { dateTime: event.end }
    if (event.attendees) updateBody.attendees = event.attendees

    await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: updateBody,
    })
}

/**
 * Delete event from Google Calendar
 * 
 * @param studioId - Professional studio ID
 * @param calendarId - Google Calendar ID
 * @param eventId - Google event ID
 */
export async function deleteEvent(
    studioId: string,
    calendarId: string,
    eventId: string
): Promise<void> {
    const calendar = await getCalendarClient(studioId)

    await calendar.events.delete({
        calendarId,
        eventId,
    })
}

// ============================================================================
// INCREMENTAL SYNC
// ============================================================================

/**
 * Perform incremental sync of calendar events using sync token
 * 
 * Syncs changes since last sync (efficient). Falls back to full sync if
 * sync token is invalid (e.g., expired or first sync).
 * 
 * @param studioId - Professional studio ID
 * @returns Sync result with counts and new sync token
 */
export async function incrementalSync(studioId: string): Promise<SyncResult> {
    const calendar = await getCalendarClient(studioId)

    // 1. Get connection with sync token and selected calendar
    const { data: connection } = await supabaseServer
        .from('google_calendar_connections')
        .select('*')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    if (!connection || !connection.selected_calendar_id) {
        throw new Error('No calendar selected for sync')
    }

    const calendarId = connection.selected_calendar_id
    const syncToken = connection.sync_token

    let added = 0
    let updated = 0
    let deleted = 0
    let nextSyncToken: string | null = null

    try {
        // 2. Attempt incremental sync with sync token
        const params: any = {
            calendarId,
            maxResults: 250, // Process in batches
            singleEvents: true,
        }

        if (syncToken) {
            params.syncToken = syncToken
        } else {
            // First sync - fetch events from 30 days ago to 90 days ahead
            const now = new Date()
            params.timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            params.timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }

        let pageToken: string | null | undefined = null

        do {
            if (pageToken) params.pageToken = pageToken

            const response = await calendar.events.list(params)

            // Process events
            for (const event of response.data.items || []) {
                if (event.status === 'cancelled') {
                    // Event deleted
                    await supabaseServer
                        .from('studio_external_events')
                        .delete()
                        .eq('professional_studio_id', studioId)
                        .eq('google_event_id', event.id!)

                    deleted++
                } else {
                    // Event created or updated
                    const eventData = {
                        professional_studio_id: studioId,
                        google_event_id: event.id!,
                        google_calendar_id: calendarId,
                        start_time: event.start?.dateTime || event.start?.date!,
                        end_time: event.end?.dateTime || event.end?.date!,
                        summary: event.summary || '(No title)',
                        is_all_day: !!event.start?.date,
                    }

                    const { error: upsertError } = await supabaseServer
                        .from('studio_external_events')
                        .upsert(eventData, {
                            onConflict: 'professional_studio_id,google_event_id',
                        })

                    if (upsertError) {
                        console.error('Failed to upsert external event:', upsertError)
                    } else {
                        // Check if it was insert (added) or update
                        const { count } = await supabaseServer
                            .from('studio_external_events')
                            .select('id', { count: 'exact', head: true })
                            .eq('professional_studio_id', studioId)
                            .eq('google_event_id', event.id!)

                        if (count === 1) added++
                        else updated++
                    }
                }
            }

            nextSyncToken = response.data.nextSyncToken || null
            pageToken = response.data.nextPageToken
        } while (pageToken)

        // 3. Save new sync token
        if (nextSyncToken) {
            await supabaseServer
                .from('google_calendar_connections')
                .update({
                    sync_token: nextSyncToken,
                    last_synced_at: new Date().toISOString(),
                })
                .eq('professional_studio_id', studioId)
        }

        return { added, updated, deleted, nextSyncToken: nextSyncToken || '' }
    } catch (error: any) {
        // If sync token is invalid, clear it and trigger full sync next time
        if (error.message.includes('Sync token') || error.code === 410) {
            console.log('Sync token invalid, clearing for full sync next time')
            await supabaseServer
                .from('google_calendar_connections')
                .update({ sync_token: null })
                .eq('professional_studio_id', studioId)
        }
        throw error
    }
}

// ============================================================================
// PUSH NOTIFICATIONS (WATCH CHANNEL)
// ============================================================================

/**
 * Setup watch channel for push notifications (7-day expiration)
 * 
 * Google will send webhook POST requests to configured URL when calendar changes.
 * Channels must be renewed before expiration (7 days).
 * 
 * @param studioId - Professional studio ID
 * @returns Watch channel info (channelId, resourceId, expiration)
 */
export async function setupWatchChannel(studioId: string): Promise<{
    channelId: string
    resourceId: string
    expiration: number
}> {
    const calendar = await getCalendarClient(studioId)

    // Get connection to retrieve selected calendar
    const { data: connection } = await supabaseServer
        .from('google_calendar_connections')
        .select('selected_calendar_id')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    if (!connection || !connection.selected_calendar_id) {
        throw new Error('No calendar selected')
    }

    const calendarId = connection.selected_calendar_id
    const channelId = `studio-${studioId}-${Date.now()}` // Unique channel ID
    const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL!
    const webhookSecret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET!

    // Create watch channel
    const response = await calendar.events.watch({
        calendarId,
        requestBody: {
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
            token: webhookSecret, // Sent in X-Goog-Channel-Token header for validation
        },
    })

    const expiration = parseInt(response.data.expiration!, 10)

    // Save channel info to database
    await supabaseServer
        .from('google_calendar_connections')
        .update({
            watch_channel_id: channelId,
            watch_resource_id: response.data.resourceId!,
            watch_expires_at: new Date(expiration).toISOString(),
        })
        .eq('professional_studio_id', studioId)

    return {
        channelId,
        resourceId: response.data.resourceId!,
        expiration,
    }
}

/**
 * Stop watch channel (unsubscribe from push notifications)
 * 
 * @param studioId - Professional studio ID
 */
export async function stopWatchChannel(studioId: string): Promise<void> {
    const calendar = await getCalendarClient(studioId)

    const { data: connection } = await supabaseServer
        .from('google_calendar_connections')
        .select('watch_channel_id, watch_resource_id')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    if (!connection || !connection.watch_channel_id || !connection.watch_resource_id) {
        console.log('No active watch channel found')
        return
    }

    try {
        await calendar.channels.stop({
            requestBody: {
                id: connection.watch_channel_id,
                resourceId: connection.watch_resource_id,
            },
        })

        // Clear watch channel from database
        await supabaseServer
            .from('google_calendar_connections')
            .update({
                watch_channel_id: null,
                watch_resource_id: null,
                watch_expires_at: null,
            })
            .eq('professional_studio_id', studioId)

        console.log(`✅ Watch channel stopped for studio ${studioId}`)
    } catch (error: any) {
        console.error('Failed to stop watch channel:', error.message)
        // Continue anyway to clean up database
    }
}
