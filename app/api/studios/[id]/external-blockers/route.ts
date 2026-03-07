export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const studioId = params.id

        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return withCors(NextResponse.json({ error: 'studio_not_found' }, { status: 404 }))
        }

        if (String(studio.owner_id) !== String(authenticatedUserId)) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const { startTime, endTime, summary } = body

        if (!startTime || !endTime) {
            return withCors(NextResponse.json({ error: 'startTime_and_endTime_required' }, { status: 400 }))
        }

        const { data, error } = await supabaseServer
            .from('studio_external_events')
            .insert({
                professional_studio_id: studioId,
                google_event_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                google_calendar_id: 'manual_blockers',
                start_time: startTime,
                end_time: endTime,
                summary: summary || 'Occupato personale',
                is_all_day: false,
            })
            .select('id, start_time, end_time, summary')
            .single()

        if (error) {
            throw error
        }

        return withCors(NextResponse.json({
            id: data.id,
            startTime: data.start_time,
            endTime: data.end_time,
            summary: data.summary,
        }, { status: 201 }))
    } catch (error: any) {
        console.error('Error creating manual blocker:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
