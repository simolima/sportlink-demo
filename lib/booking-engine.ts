/**
 * Booking Engine
 * 
 * Core algorithm for computing available booking slots:
 * Available Slots = Base Availability - Existing Bookings - External Events - Buffers
 * 
 * This engine integrates:
 * - Availability rules (weekly schedule, blackout dates)
 * - Existing studio appointments
 * - Google Calendar external events (conflict detection)
 * - Appointment type settings (duration, buffers)
 */

import { supabaseServer } from './supabase-server'
import {
    getDayAvailability,
    generateTimeSlots,
    timeSlotsOverlap,
    addMinutesToTime,
} from './availability-engine'
import {
    DEFAULT_STUDIO_TIMEZONE,
    getDateInTimezone,
    getTimeInTimezone,
    getUtcDayBoundsForTimezoneDate,
} from './date-timezone'

// ============================================================================
// TYPES
// ============================================================================

export interface AvailableSlot {
    startTime: string // HH:MM format (e.g., "09:00")
    endTime: string // HH:MM format (computed from startTime + duration)
}

export interface OccupiedSlot {
    startTime: string // HH:MM
    endTime: string // HH:MM
    source: 'booking' | 'external_event'
}

// ============================================================================
// SLOT COMPUTATION
// ============================================================================

/**
 * Compute available booking slots for a specific date and appointment type
 * 
 * @param studioId - Professional studio ID
 * @param appointmentTypeId - Type of appointment (defines duration and buffers)
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of available slots with start/end times
 */
export async function computeAvailableSlots(
    studioId: string,
    appointmentTypeId: string,
    date: string
): Promise<AvailableSlot[]> {
    // 1. Fetch appointment type details (duration, buffers)
    const { data: appointmentType, error: typeError } = await supabaseServer
        .from('studio_appointment_types')
        .select('duration_minutes, buffer_before_minutes, buffer_after_minutes')
        .eq('id', appointmentTypeId)
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .eq('is_active', true)
        .single()

    if (typeError || !appointmentType) {
        throw new Error('Appointment type not found or inactive')
    }

    const durationMinutes = appointmentType.duration_minutes
    const bufferBefore = appointmentType.buffer_before_minutes || 0
    const bufferAfter = appointmentType.buffer_after_minutes || 0

    // 2. Fetch studio settings (slot increment)
    const { data: studio, error: studioError } = await supabaseServer
        .from('professional_studios')
        .select('slot_increment_minutes, timezone')
        .eq('id', studioId)
        .is('deleted_at', null)
        .single()

    if (studioError || !studio) {
        throw new Error('Studio not found')
    }

    const slotIncrement = studio.slot_increment_minutes || 30
    const studioTimezone = studio.timezone || DEFAULT_STUDIO_TIMEZONE

    // 3. Get base availability (weekly schedule - blackout dates)
    const dayAvailability = await getDayAvailability(studioId, date)

    if (dayAvailability.isBlackout || dayAvailability.slots.length === 0) {
        return [] // No availability on this day
    }

    // 4. Generate potential slots from base availability
    const potentialSlots = generateTimeSlots(dayAvailability.slots, slotIncrement, durationMinutes)

    // 5. Fetch occupied slots (existing bookings + external events)
    const occupiedSlots = await getOccupiedSlots(studioId, date, studioTimezone)

    // 6. Filter out occupied slots and apply buffers
    const availableSlots: AvailableSlot[] = []

    for (const slotStart of potentialSlots) {
        const slotEnd = addMinutesToTime(slotStart, durationMinutes)
        const slotStartWithBuffer = addMinutesToTime(slotStart, -bufferBefore)
        const slotEndWithBuffer = addMinutesToTime(slotEnd, bufferAfter)

        // Check if slot (with buffers) overlaps with any occupied slot
        let isOccupied = false
        for (const occupied of occupiedSlots) {
            if (timeSlotsOverlap(slotStartWithBuffer, slotEndWithBuffer, occupied.startTime, occupied.endTime)) {
                isOccupied = true
                break
            }
        }

        if (!isOccupied) {
            availableSlots.push({
                startTime: slotStart,
                endTime: slotEnd,
            })
        }
    }

    return availableSlots
}

/**
 * Get all occupied time slots for a specific date
 * 
 * Combines:
 * - Existing studio appointments (confirmed/pending)
 * - Google Calendar external events (cached)
 * 
 * @param studioId - Professional studio ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of occupied slots with source attribution
 */
async function getOccupiedSlots(studioId: string, date: string, studioTimezone: string): Promise<OccupiedSlot[]> {
    const occupiedSlots: OccupiedSlot[] = []

    // 1. Fetch existing bookings for this date
    const { startUtcIso, endUtcIso } = getUtcDayBoundsForTimezoneDate(date, studioTimezone)

    const { data: bookings, error: bookingsError } = await supabaseServer
        .from('studio_appointments')
        .select('start_time, end_time')
        .eq('studio_id', studioId)
        .is('deleted_at', null)
        .in('status', ['pending', 'confirmed']) // Exclude completed/cancelled
        .lt('start_time', endUtcIso)
        .gt('end_time', startUtcIso)

    if (!bookingsError && bookings) {
        for (const booking of bookings) {
            const startTime = getTimeInTimezone(booking.start_time, studioTimezone)
            const endTime = getTimeInTimezone(booking.end_time, studioTimezone)

            occupiedSlots.push({
                startTime,
                endTime,
                source: 'booking',
            })
        }
    }

    // 2. Fetch external events (Google Calendar) for this date
    const { data: externalEvents, error: eventsError } = await supabaseServer
        .from('studio_external_events')
        .select('start_time, end_time, is_all_day')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .lt('start_time', endUtcIso)
        .gt('end_time', startUtcIso)

    if (!eventsError && externalEvents) {
        for (const event of externalEvents) {
            // Skip all-day events (they don't block specific time slots)
            if (event.is_all_day) continue

            const startTime = getTimeInTimezone(event.start_time, studioTimezone)
            const endTime = getTimeInTimezone(event.end_time, studioTimezone)

            occupiedSlots.push({
                startTime,
                endTime,
                source: 'external_event',
            })
        }
    }

    return occupiedSlots
}

/**
 * Validate that a booking request doesn't conflict with existing bookings/events
 * 
 * @param studioId - Professional studio ID
 * @param startTime - ISO 8601 datetime string
 * @param endTime - ISO 8601 datetime string
 * @returns true if slot is available, false if conflict exists
 */
export async function validateBookingSlot(
    studioId: string,
    startTime: string,
    endTime: string
): Promise<boolean> {
    const { data: studio } = await supabaseServer
        .from('professional_studios')
        .select('timezone')
        .eq('id', studioId)
        .is('deleted_at', null)
        .single()

    const studioTimezone = studio?.timezone || DEFAULT_STUDIO_TIMEZONE

    // Extract date from startTime in studio timezone
    const date = getDateInTimezone(startTime, studioTimezone)

    // Get occupied slots for that date
    const occupiedSlots = await getOccupiedSlots(studioId, date, studioTimezone)

    // Extract time portions (HH:MM) in studio timezone
    const requestStartTime = getTimeInTimezone(startTime, studioTimezone)
    const requestEndTime = getTimeInTimezone(endTime, studioTimezone)

    // Check for conflicts
    for (const occupied of occupiedSlots) {
        if (timeSlotsOverlap(requestStartTime, requestEndTime, occupied.startTime, occupied.endTime)) {
            return false // Conflict detected
        }
    }

    return true // No conflicts, slot is available
}
