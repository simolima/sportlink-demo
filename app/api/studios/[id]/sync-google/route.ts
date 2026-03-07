/**
 * API Route: Manual Google Calendar Sync
 * 
 * POST /api/studios/[id]/sync-google
 * 
 * Triggers manual incremental sync of Google Calendar events.
 * Returns sync result with counts of events added/updated/deleted.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'
import { incrementalSync } from '@/lib/google-calendar-service'

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

        // 2. Check if calendar is connected and selected
        const { data: connection } = await supabaseServer
            .from('google_calendar_connections')
            .select('selected_calendar_id')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (!connection || !connection.selected_calendar_id) {
            return withCors(
                NextResponse.json(
                    { error: 'no_calendar_selected', message: 'Please select a calendar first' },
                    { status: 400 }
                )
            )
        }

        // 3. Trigger incremental sync
        console.log(`🔄 Starting manual sync for studio ${studioId}`)
        const result = await incrementalSync(studioId)

        console.log(
            `✅ Sync complete for studio ${studioId}: +${result.added} ~${result.updated} -${result.deleted}`
        )

        return withCors(
            NextResponse.json({
                success: true,
                result: {
                    added: result.added,
                    updated: result.updated,
                    deleted: result.deleted,
                },
            })
        )
    } catch (error: any) {
        console.error('Error during manual sync:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
