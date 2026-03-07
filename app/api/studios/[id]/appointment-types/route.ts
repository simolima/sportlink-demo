/**
 * API Route: Studio Appointment Types (Service Catalog)
 * 
 * GET  /api/studios/[id]/appointment-types - List appointment types
 * POST /api/studios/[id]/appointment-types - Create new appointment type
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
 * GET - List appointment types
 * 
 * Query params:
 * - includeInactive: boolean (default false) - owner can see inactive types
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const url = new URL(req.url)
        const includeInactive = url.searchParams.get('includeInactive') === 'true'

        // Check if requester is owner
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        const { data: studio } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        const isOwner = studio?.owner_id === authenticatedUserId

        // Build query
        let query = supabaseServer
            .from('studio_appointment_types')
            .select('*')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .order('name', { ascending: true })

        // If not owner or includeInactive is false, filter only active types
        if (!isOwner || !includeInactive) {
            query = query.eq('is_active', true)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch appointment types: ${error.message}`)
        }

        return withCors(NextResponse.json(data || []))
    } catch (error: any) {
        console.error('Error fetching appointment types:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * POST - Create new appointment type (owner only)
 * 
 * Body: {
 *   name: string (e.g., "Initial Consultation"),
 *   description: string (optional),
 *   durationMinutes: number (15-480),
 *   bufferBeforeMinutes: number (0-60, default 0),
 *   bufferAfterMinutes: number (0-60, default 0),
 *   priceAmount: number (nullable),
 *   colorHex: string (default "#2341F0")
 * }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const body = await req.json()
        const {
            name,
            description,
            durationMinutes,
            bufferBeforeMinutes,
            bufferAfterMinutes,
            priceAmount,
            colorHex,
        } = body

        // 1. Validation
        if (!name || !durationMinutes) {
            return withCors(NextResponse.json({ error: 'name_and_duration_required' }, { status: 400 }))
        }

        if (durationMinutes < 15 || durationMinutes > 480) {
            return withCors(
                NextResponse.json({ error: 'duration_must_be_between_15_and_480_minutes' }, { status: 400 })
            )
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

        // 3. Create appointment type
        const { data, error } = await supabaseServer
            .from('studio_appointment_types')
            .insert({
                professional_studio_id: studioId,
                name,
                description: description || null,
                duration_minutes: durationMinutes,
                buffer_before_minutes: bufferBeforeMinutes || 0,
                buffer_after_minutes: bufferAfterMinutes || 0,
                price_amount: priceAmount || null,
                color_hex: colorHex || '#2341F0',
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create appointment type: ${error.message}`)
        }

        console.log(`✅ Appointment type created for studio ${studioId}: ${name}`)

        return withCors(NextResponse.json(data, { status: 201 }))
    } catch (error: any) {
        console.error('Error creating appointment type:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
