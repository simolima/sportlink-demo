/**
 * API Route: Google Calendar Webhook Handler
 * 
 * POST /api/webhooks/google-calendar
 * 
 * Receives push notifications from Google Calendar when events change.
 * Validates webhook signature and triggers incremental sync.
 * 
 * Google sends notifications with headers:
 * - X-Goog-Channel-Token: Secret token for validation
 * - X-Goog-Resource-State: "sync" | "exists" | "not_exists"
 * - X-Goog-Channel-ID: Channel ID
 * - X-Goog-Resource-ID: Resource ID
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { incrementalSync } from '@/lib/google-calendar-service'

const WEBHOOK_SECRET = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET

export async function POST(req: Request) {
    try {
        // 1. Validate webhook signature
        const channelToken = req.headers.get('x-goog-channel-token')

        if (channelToken !== WEBHOOK_SECRET) {
            console.error('❌ Invalid webhook signature')
            return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
        }

        // 2. Extract headers
        const resourceState = req.headers.get('x-goog-resource-state')
        const channelId = req.headers.get('x-goog-channel-id')
        const resourceId = req.headers.get('x-goog-resource-id')

        console.log(`📥 Webhook received: state=${resourceState} channel=${channelId}`)

        // Skip "sync" notifications (initial setup confirmation)
        if (resourceState === 'sync') {
            console.log('⏭️  Skipping sync notification')
            return NextResponse.json({ received: true })
        }

        // 3. Find studio by channel ID
        const { data: connection, error } = await supabaseServer
            .from('google_calendar_connections')
            .select('professional_studio_id')
            .eq('watch_channel_id', channelId)
            .eq('watch_resource_id', resourceId)
            .is('deleted_at', null)
            .single()

        if (error || !connection) {
            console.error('⚠️  No matching connection found for webhook')
            return NextResponse.json({ error: 'connection_not_found' }, { status: 404 })
        }

        const studioId = connection.professional_studio_id

        // 4. Trigger incremental sync (async - don't block webhook response)
        setImmediate(async () => {
            try {
                console.log(`🔄 Triggering sync for studio ${studioId} (webhook)`)
                const result = await incrementalSync(studioId)
                console.log(
                    `✅ Webhook sync complete for studio ${studioId}: +${result.added} ~${result.updated} -${result.deleted}`
                )
            } catch (syncError: any) {
                console.error(`❌ Webhook sync failed for studio ${studioId}:`, syncError.message)
            }
        })

        // 5. Return 200 OK immediately (Google requires quick response)
        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('❌ Webhook handler error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * Handle OPTIONS for CORS preflight (Google may send preflight)
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Goog-Channel-Token',
        },
    })
}
