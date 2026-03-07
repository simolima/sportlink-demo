/**
 * Availability Engine
 * 
 * Parses weekly availability rules and blackout dates to determine
 * when a professional studio is available for bookings.
 * 
 * This is the source of truth for slot computation - Google Calendar
 * is only used for conflict detection, not availability definition.
 */

import { supabaseServer } from './supabase-server'

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSlot {
    start: string // HH:MM format (e.g., "09:00")
    end: string // HH:MM format (e.g., "13:00")
}

export interface WeeklySchedule {
    monday?: TimeSlot[]
    tuesday?: TimeSlot[]
    wednesday?: TimeSlot[]
    thursday?: TimeSlot[]
    friday?: TimeSlot[]
    saturday?: TimeSlot[]
    sunday?: TimeSlot[]
}

export interface DayAvailability {
    date: string // YYYY-MM-DD
    slots: TimeSlot[]
    isBlackout: boolean
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate weekly schedule JSON structure
 * 
 * @param schedule - Weekly schedule object
 * @throws Error if validation fails
 */
export function validateWeeklySchedule(schedule: WeeklySchedule): void {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    for (const [day, slots] of Object.entries(schedule)) {
        // Check valid day name
        if (!validDays.includes(day)) {
            throw new Error(`Invalid day name: ${day}`)
        }

        // Check slots array
        if (!Array.isArray(slots)) {
            throw new Error(`Slots for ${day} must be an array`)
        }

        // Validate each slot
        for (const slot of slots) {
            if (!slot.start || !slot.end) {
                throw new Error(`Missing start or end time in slot for ${day}`)
            }

            // Validate time format (HH:MM)
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(slot.start)) {
                throw new Error(`Invalid start time format: ${slot.start} (expected HH:MM)`)
            }
            if (!timeRegex.test(slot.end)) {
                throw new Error(`Invalid end time format: ${slot.end} (expected HH:MM)`)
            }

            // Validate end time > start time
            const startMinutes = timeToMinutes(slot.start)
            const endMinutes = timeToMinutes(slot.end)
            if (endMinutes <= startMinutes) {
                throw new Error(`End time must be after start time: ${slot.start} - ${slot.end}`)
            }
        }
    }
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to HH:MM string
 */
function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

/**
 * Get base availability for a specific date (from weekly schedule)
 * 
 * @param studioId - Professional studio ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of available time slots for that day
 */
export async function getBaseAvailability(studioId: string, date: string): Promise<TimeSlot[]> {
    // 1. Fetch availability rules
    const { data: rules, error } = await supabaseServer
        .from('studio_availability_rules')
        .select('weekly_schedule')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    if (error || !rules) {
        console.log(`No availability rules found for studio ${studioId}`)
        return []
    }

    // 2. Determine day of week
    const dateObj = new Date(date + 'T00:00:00Z') // Force UTC to avoid timezone issues
    const dayOfWeek = dateObj.getUTCDay() // 0 = Sunday, 1 = Monday, ...
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]

    // 3. Get slots for that day
    const schedule = rules.weekly_schedule as WeeklySchedule
    const slots = schedule[dayName as keyof WeeklySchedule] || []

    return slots
}

/**
 * Check if a date falls within a blackout period
 * 
 * @param studioId - Professional studio ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns true if date is blacked out (unavailable)
 */
export async function isBlackoutDate(studioId: string, date: string): Promise<boolean> {
    const { data: blackoutDates, error } = await supabaseServer
        .from('studio_blackout_dates')
        .select('start_date, end_date')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .lte('start_date', date)
        .gte('end_date', date)

    if (error) {
        console.error('Error checking blackout dates:', error)
        return false
    }

    return blackoutDates && blackoutDates.length > 0
}

/**
 * Get day availability including blackout check
 * 
 * @param studioId - Professional studio ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Day availability object
 */
export async function getDayAvailability(studioId: string, date: string): Promise<DayAvailability> {
    // 1. Check if blackout date
    const isBlackout = await isBlackoutDate(studioId, date)

    if (isBlackout) {
        return {
            date,
            slots: [],
            isBlackout: true,
        }
    }

    // 2. Get base availability from weekly schedule
    const slots = await getBaseAvailability(studioId, date)

    return {
        date,
        slots,
        isBlackout: false,
    }
}

/**
 * Generate time slots from availability rules with configurable increment
 * 
 * @param slots - Array of time slot ranges (e.g., [{start: "09:00", end: "13:00"}])
 * @param incrementMinutes - Slot increment (15, 30, or 60 minutes)
 * @param durationMinutes - Duration of appointment type
 * @returns Array of slot start times (only times where full duration fits)
 */
export function generateTimeSlots(
    slots: TimeSlot[],
    incrementMinutes: number,
    durationMinutes: number
): string[] {
    const generatedSlots: string[] = []

    for (const slot of slots) {
        const startMinutes = timeToMinutes(slot.start)
        const endMinutes = timeToMinutes(slot.end)

        // Generate slots with increment
        for (let current = startMinutes; current < endMinutes; current += incrementMinutes) {
            // Only include slot if full appointment duration fits before end
            if (current + durationMinutes <= endMinutes) {
                generatedSlots.push(minutesToTime(current))
            }
        }
    }

    return generatedSlots
}

/**
 * Check if two time ranges overlap
 * 
 * @param start1 - Start time of range 1 (HH:MM)
 * @param end1 - End time of range 1 (HH:MM)
 * @param start2 - Start time of range 2 (HH:MM)
 * @param end2 - End time of range 2 (HH:MM)
 * @returns true if ranges overlap
 */
export function timeSlotsOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const start1Min = timeToMinutes(start1)
    const end1Min = timeToMinutes(end1)
    const start2Min = timeToMinutes(start2)
    const end2Min = timeToMinutes(end2)

    // Overlap if: start1 < end2 AND start2 < end1
    return start1Min < end2Min && start2Min < end1Min
}

/**
 * Add minutes to a time string (HH:MM)
 * 
 * @param time - Time string (HH:MM)
 * @param minutes - Minutes to add
 * @returns New time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = timeToMinutes(time) + minutes
    return minutesToTime(totalMinutes)
}
