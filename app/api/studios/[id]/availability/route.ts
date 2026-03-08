/**
 * API Route: Studio Availability Rules
 * 
 * GET  /api/studios/[id]/availability - Get weekly schedule
 * POST /api/studios/[id]/availability - Upsert weekly schedule
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { getUserIdFromAuthToken } from '@/lib/supabase-server'
import { supabaseServer } from '@/lib/supabase-server'
import { validateWeeklySchedule } from '@/lib/availability-engine'

export async function OPTIONS() {
    return handleOptions()
}

/**
 * GET - Fetch availability rules
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id

        // Fetch rules (public read - anyone can see availability for booking)
        const { data: rules, error } = await supabaseServer
            .from('studio_availability_rules')
            .select('*')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        if (error || !rules) {
            // No rules yet - return empty schedule
            return withCors(
                NextResponse.json({
                    weeklySchedule: {},
                    timezone: 'Europe/Rome',
                })
            )
        }

        return withCors(
            NextResponse.json({
                weeklySchedule: rules.weekly_schedule,
                timezone: rules.timezone,
            })
        )
    } catch (error: any) {
        console.error('Error fetching availability rules:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

/**
 * POST - Upsert availability rules (owner only)
 * 
 * Body: {
 *   weeklySchedule: {
 *     monday: [{ start: "09:00", end: "13:00" }, ...],
 *     ...
 *   },
 *   timezone: "Europe/Rome"
 * }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const body = await req.json()
        const { weeklySchedule, timezone } = body

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

        // 2. Validate weekly schedule structure
        try {
            validateWeeklySchedule(weeklySchedule)
        } catch (validationError: any) {
            return withCors(
                NextResponse.json({ error: `validation_failed: ${validationError.message}` }, { status: 400 })
            )
        }

        // 3. Check if a record already exists, then UPDATE or INSERT
        const { data: existing } = await supabaseServer
            .from('studio_availability_rules')
            .select('id')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        let data, error
        if (existing) {
            // UPDATE existing record
            ; ({ data, error } = await supabaseServer
                .from('studio_availability_rules')
                .update({
                    weekly_schedule: weeklySchedule,
                    timezone: timezone || 'Europe/Rome',
                })
                .eq('id', existing.id)
                .select()
                .single())
        } else {
            // INSERT new record
            ; ({ data, error } = await supabaseServer
                .from('studio_availability_rules')
                .insert({
                    professional_studio_id: studioId,
                    weekly_schedule: weeklySchedule,
                    timezone: timezone || 'Europe/Rome',
                })
                .select()
                .single())
        }

        if (error) {
            throw new Error(`Failed to save availability rules: ${error.message}`)
        }

        console.log(`✅ Availability rules saved for studio ${studioId}`)

        return withCors(NextResponse.json({ success: true, data }))
    } catch (error: any) {
        console.error('Error saving availability rules:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
