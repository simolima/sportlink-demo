/**
 * API Route: Single Blackout Date Management
 * 
 * PATCH  /api/studios/[id]/blackout-dates/[blackoutId] - Update blackout period
 * DELETE /api/studios/[id]/blackout-dates/[blackoutId] - Delete blackout period
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
 * PATCH - Update blackout period
 */
export async function PATCH(
    req: Request,
    { params }: { params: { id: string; blackoutId: string } }
) {
    try {
        const { id: studioId, blackoutId } = params
        const body = await req.json()
        const { startDate, endDate, reason } = body

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

        // 2. Validation if dates provided
        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            if (end < start) {
                return withCors(
                    NextResponse.json({ error: 'end_date_must_be_after_start_date' }, { status: 400 })
                )
            }
        }

        // 3. Update blackout date
        const updateData: any = {}
        if (startDate) updateData.start_date = startDate
        if (endDate) updateData.end_date = endDate
        if (reason !== undefined) updateData.reason = reason

        const { data, error } = await supabaseServer
            .from('studio_blackout_dates')
            .update(updateData)
            .eq('id', blackoutId)
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .select()
            .single()

        if (error || !data) {
            return withCors(NextResponse.json({ error: 'blackout_date_not_found' }, { status: 404 }))
        }

        console.log(`✅ Blackout period updated for studio ${studioId}`)

        return withCors(NextResponse.json(data))
    } catch (error: any) {
        console.error('Error updating blackout date:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * DELETE - Soft delete blackout period
 */
export async function DELETE(
    req: Request,
    { params }: { params: { id: string; blackoutId: string } }
) {
    try {
        const { id: studioId, blackoutId } = params

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

        // 2. Soft delete
        const { error } = await supabaseServer
            .from('studio_blackout_dates')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', blackoutId)
            .eq('professional_studio_id', studioId)

        if (error) {
            return withCors(NextResponse.json({ error: 'blackout_date_not_found' }, { status: 404 }))
        }

        console.log(`✅ Blackout period deleted for studio ${studioId}`)

        return withCors(NextResponse.json({ success: true }))
    } catch (error: any) {
        console.error('Error deleting blackout date:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
