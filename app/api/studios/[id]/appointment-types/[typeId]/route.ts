/**
 * API Route: Single Appointment Type Management
 * 
 * GET    /api/studios/[id]/appointment-types/[typeId] - Get single type
 * PATCH  /api/studios/[id]/appointment-types/[typeId] - Update type
 * DELETE /api/studios/[id]/appointment-types/[typeId] - Soft delete type
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
 * GET - Fetch single appointment type
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string; typeId: string } }
) {
    try {
        const { id: studioId, typeId } = params

        const { data, error } = await supabaseServer
            .from('studio_appointment_types')
            .select('*')
            .eq('id', typeId)
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (error || !data) {
            return withCors(NextResponse.json({ error: 'appointment_type_not_found' }, { status: 404 }))
        }

        return withCors(NextResponse.json(data))
    } catch (error: any) {
        console.error('Error fetching appointment type:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * PATCH - Update appointment type (owner only)
 */
export async function PATCH(
    req: Request,
    { params }: { params: { id: string; typeId: string } }
) {
    try {
        const { id: studioId, typeId } = params
        const body = await req.json()

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

        // 2. Build update object (only include provided fields)
        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.description !== undefined) updateData.description = body.description
        if (body.durationMinutes !== undefined) {
            if (body.durationMinutes < 15 || body.durationMinutes > 480) {
                return withCors(
                    NextResponse.json(
                        { error: 'duration_must_be_between_15_and_480_minutes' },
                        { status: 400 }
                    )
                )
            }
            updateData.duration_minutes = body.durationMinutes
        }
        if (body.bufferBeforeMinutes !== undefined) {
            updateData.buffer_before_minutes = body.bufferBeforeMinutes
        }
        if (body.bufferAfterMinutes !== undefined) {
            updateData.buffer_after_minutes = body.bufferAfterMinutes
        }
        if (body.priceAmount !== undefined) updateData.price_amount = body.priceAmount
        if (body.colorHex !== undefined) updateData.color_hex = body.colorHex
        if (body.isActive !== undefined) updateData.is_active = body.isActive

        // 3. Update appointment type
        const { data, error } = await supabaseServer
            .from('studio_appointment_types')
            .update(updateData)
            .eq('id', typeId)
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .select()
            .single()

        if (error || !data) {
            return withCors(NextResponse.json({ error: 'appointment_type_not_found' }, { status: 404 }))
        }

        console.log(`✅ Appointment type updated for studio ${studioId}`)

        return withCors(NextResponse.json(data))
    } catch (error: any) {
        console.error('Error updating appointment type:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * DELETE - Soft delete appointment type (owner only)
 */
export async function DELETE(
    req: Request,
    { params }: { params: { id: string; typeId: string } }
) {
    try {
        const { id: studioId, typeId } = params

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
            .from('studio_appointment_types')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', typeId)
            .eq('professional_studio_id', studioId)

        if (error) {
            return withCors(NextResponse.json({ error: 'appointment_type_not_found' }, { status: 404 }))
        }

        console.log(`✅ Appointment type deleted for studio ${studioId}`)

        return withCors(NextResponse.json({ success: true }))
    } catch (error: any) {
        console.error('Error deleting appointment type:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
