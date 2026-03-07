/**
 * API Route: List Google Calendars available to connected account
 *
 * GET /api/studios/[id]/google-calendars
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'
import { listCalendars } from '@/lib/google-calendar-service'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id

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

        console.log(`📅 Fetching Google calendars for studio ${studioId}`)
        const calendars = await listCalendars(studioId)
        console.log(`✅ Found ${calendars.length} calendars:`, calendars.map(c => c.summary))

        return withCors(NextResponse.json({ calendars }))
    } catch (error: any) {
        console.error(`❌ Error fetching Google calendars for studio ${studioId}:`, error.message)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
