/**
 * API Route: Compute Available Booking Slots
 * 
 * GET /api/studios/[id]/available-slots?date=2026-03-15&appointmentTypeId=...
 * 
 * Returns array of available time slots for booking based on:
 * - Weekly availability schedule
 * - Blackout dates
 * - Existing bookings
 * - Google Calendar external events
 * - Appointment type duration and buffers
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer } from '@/lib/supabase-server'
import { computeAvailableSlots } from '@/lib/booking-engine'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const studioId = params.id
        const url = new URL(req.url)
        const date = url.searchParams.get('date')
        const appointmentTypeId = url.searchParams.get('appointmentTypeId')
        const daysAheadParam = url.searchParams.get('daysAhead')
        const daysAhead = Math.max(1, Math.min(60, Number(daysAheadParam || '14')))

        // 1. Validation
        if (!appointmentTypeId) {
            return withCors(NextResponse.json({ error: 'appointment_type_id_required' }, { status: 400 }))
        }

        // Validate date format (YYYY-MM-DD) if provided
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return withCors(NextResponse.json({ error: 'invalid_date_format' }, { status: 400 }))
        }

        // 2. Verify studio exists and booking is enabled
        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('booking_enabled')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return withCors(NextResponse.json({ error: 'studio_not_found' }, { status: 404 }))
        }

        if (!studio.booking_enabled) {
            return withCors(
                NextResponse.json(
                    { error: 'booking_not_enabled', message: 'Online booking is not active for this studio' },
                    { status: 403 }
                )
            )
        }

        // 3. Compute available slots (single date or multi-day search)
        if (date) {
            const availableSlots = await computeAvailableSlots(studioId, appointmentTypeId, date)
            return withCors(
                NextResponse.json({
                    date,
                    appointmentTypeId,
                    slots: availableSlots,
                    count: availableSlots.length,
                })
            )
        }

        const byDay: Record<string, any[]> = {}
        let firstAvailable: { date: string; slot: any } | null = null

        for (let i = 0; i < daysAhead; i++) {
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + i)
            const dateIso = targetDate.toISOString().slice(0, 10)

            const daySlots = await computeAvailableSlots(studioId, appointmentTypeId, dateIso)
            byDay[dateIso] = daySlots

            if (!firstAvailable && daySlots.length > 0) {
                firstAvailable = {
                    date: dateIso,
                    slot: daySlots[0],
                }
            }
        }

        return withCors(
            NextResponse.json({
                appointmentTypeId,
                daysAhead,
                firstAvailable,
                byDay,
            })
        )
    } catch (error: any) {
        console.error('Error computing available slots:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
