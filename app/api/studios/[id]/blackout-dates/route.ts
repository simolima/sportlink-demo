/**
 * API Route: Studio Blackout Dates
 * 
 * GET  /api/studios/[id]/blackout-dates - List all blackout periods
 * POST /api/studios/[id]/blackout-dates - Create new blackout period
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

/**
 * GET - List all blackout dates for studio
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id

        // Fetch blackout dates (public read - anyone can see for booking)
        const { data: blackoutDates, error } = await supabaseServer
            .from('studio_blackout_dates')
            .select('*')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .order('start_date', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch blackout dates: ${error.message}`)
        }

        return withCors(NextResponse.json(blackoutDates || []))
    } catch (error: any) {
        console.error('Error fetching blackout dates:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * POST - Create new blackout period (owner only)
 * 
 * Body: {
 *   startDate: "2026-08-01",
 *   endDate: "2026-08-15",
 *   reason: "Summer vacation" (optional)
 * }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const body = await req.json()
        const { startDate, endDate, reason } = body

        // 1. Validation
        if (!startDate || !endDate) {
            return withCors(
                NextResponse.json({ error: 'start_date_and_end_date_required' }, { status: 400 })
            )
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end < start) {
            return withCors(NextResponse.json({ error: 'end_date_must_be_after_start_date' }, { status: 400 }))
        }

        // 2. Verify authenticated user owns studio
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

        // 3. Create blackout period
        const { data, error } = await supabaseServer
            .from('studio_blackout_dates')
            .insert({
                professional_studio_id: studioId,
                start_date: startDate,
                end_date: endDate,
                reason: reason || null,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create blackout date: ${error.message}`)
        }

        console.log(`✅ Blackout period created for studio ${studioId}: ${startDate} to ${endDate}`)

        return withCors(NextResponse.json(data, { status: 201 }))
    } catch (error: any) {
        console.error('Error creating blackout date:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
