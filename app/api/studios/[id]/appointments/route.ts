export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { validateBookingSlot } from '@/lib/booking-engine'
import { createEvent } from '@/lib/google-calendar-service'
import { createNotification } from '@/lib/notifications-repository'
import { dispatchToUser } from '@/lib/notification-dispatcher'
import { DEFAULT_STUDIO_TIMEZONE, normalizeInputDateTimeToUtcIso } from '@/lib/date-timezone'

async function getSelectedCalendarId(studioId: string): Promise<string | null> {
    const { data: connection } = await supabase
        .from('google_calendar_connections')
        .select('selected_calendar_id')
        .eq('professional_studio_id', studioId)
        .is('deleted_at', null)
        .single()

    return connection?.selected_calendar_id || null
}

async function trySyncAppointmentToGoogle(input: {
    studioId: string
    appointmentId: string
    startTime: string
    endTime: string
    timezone: string
    serviceType?: string | null
    clientName?: string | null
    notes?: string | null
}) {
    try {
        const selectedCalendarId = await getSelectedCalendarId(input.studioId)
        if (!selectedCalendarId) {
            return
        }

        const googleEventId = await createEvent(input.studioId, selectedCalendarId, {
            summary: input.serviceType || 'Prenotazione Sprinta',
            description: `Prenotazione da Sprinta${input.clientName ? `\nCliente: ${input.clientName}` : ''}${input.notes ? `\nNote: ${input.notes}` : ''}`,
            start: input.startTime,
            end: input.endTime,
            timeZone: input.timezone,
        })

        await supabase
            .from('studio_appointments')
            .update({
                google_event_id: googleEventId,
                google_sync_status: 'synced',
            })
            .eq('id', input.appointmentId)
    } catch (error: any) {
        console.error('Failed to sync appointment to Google Calendar:', error)
        await supabase
            .from('studio_appointments')
            .update({ google_sync_status: 'sync_failed' })
            .eq('id', input.appointmentId)
    }
}

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id]/appointments — lista appuntamenti
// - Owner: vede tutti
// - Utente loggato: vede solo i propri
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        // Verifica se è owner
        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id, timezone')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const isOwner = studio.owner_id === authenticatedUserId

        let query = supabase
            .from('studio_appointments')
            .select(`
                *,
                client:profiles!client_id(
                    id, first_name, last_name, avatar_url
                )
            `)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .order('start_time', { ascending: true })

        if (!isOwner) {
            query = query.eq('client_id', authenticatedUserId)
        }

        const { data, error } = await query
        if (error) throw error

        const result = (data || []).map((a: any) => ({
            id: a.id,
            studioId: a.studio_id,
            clientId: a.client_id,
            professionalId: a.professional_id,
            startTime: a.start_time,
            endTime: a.end_time,
            status: a.status,
            serviceType: a.service_type,
            appointmentTypeId: a.appointment_type_id,
            googleEventId: a.google_event_id,
            googleSyncStatus: a.google_sync_status,
            notes: a.notes,
            isExternalBlocker: a.is_external_blocker,
            createdAt: a.created_at,
            client: a.client ? {
                id: a.client.id,
                firstName: a.client.first_name,
                lastName: a.client.last_name,
                avatarUrl: a.client.avatar_url,
            } : undefined,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/studios/[id]/appointments — prenota una visita (qualsiasi utente loggato)
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const body = await req.json()
        const { startTime, endTime, serviceType, notes, appointmentTypeId } = body

        if (!startTime || !endTime) {
            return withCors(NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 }))
        }

        const studioTimezone = studio.timezone || DEFAULT_STUDIO_TIMEZONE
        const normalizedStartTime = normalizeInputDateTimeToUtcIso(String(startTime), studioTimezone)
        const normalizedEndTime = normalizeInputDateTimeToUtcIso(String(endTime), studioTimezone)

        if (new Date(normalizedEndTime).getTime() <= new Date(normalizedStartTime).getTime()) {
            return withCors(NextResponse.json({ error: 'invalid_time_range' }, { status: 400 }))
        }

        const slotIsValid = await validateBookingSlot(params.id, normalizedStartTime, normalizedEndTime)
        if (!slotIsValid) {
            return withCors(NextResponse.json({ error: 'slot_not_available' }, { status: 409 }))
        }

        let resolvedServiceType = serviceType || null
        if (appointmentTypeId) {
            const { data: appointmentType } = await supabase
                .from('studio_appointment_types')
                .select('id, name')
                .eq('id', appointmentTypeId)
                .eq('professional_studio_id', params.id)
                .is('deleted_at', null)
                .eq('is_active', true)
                .single()

            if (!appointmentType) {
                return withCors(NextResponse.json({ error: 'appointment_type_not_found' }, { status: 400 }))
            }

            resolvedServiceType = appointmentType.name
        }

        const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', authenticatedUserId)
            .single()

        const clientName = [clientProfile?.first_name, clientProfile?.last_name].filter(Boolean).join(' ').trim() || 'Utente'

        const { data: appointment, error } = await supabase
            .from('studio_appointments')
            .insert({
                studio_id: params.id,
                client_id: authenticatedUserId,
                professional_id: studio.owner_id,
                start_time: normalizedStartTime,
                end_time: normalizedEndTime,
                status: 'pending',
                service_type: resolvedServiceType,
                appointment_type_id: appointmentTypeId || null,
                notes: notes || null,
                is_external_blocker: false,
            })
            .select()
            .single()

        if (error) throw error

        // Aggiunge il client a studio_clients se non già presente
        await supabase
            .from('studio_clients')
            .upsert({
                studio_id: params.id,
                client_profile_id: authenticatedUserId,
                status: 'pending',
            }, { onConflict: 'studio_id,client_profile_id' })

        await trySyncAppointmentToGoogle({
            studioId: params.id,
            appointmentId: appointment.id,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            timezone: studioTimezone,
            serviceType: appointment.service_type,
            clientName,
            notes: appointment.notes,
        })

        if (String(studio.owner_id) !== String(authenticatedUserId)) {
            const ownerNotification = await createNotification({
                userId: studio.owner_id,
                type: 'studio_booking_request',
                title: 'Nuova prenotazione',
                message: `${clientName} ha richiesto una prenotazione${resolvedServiceType ? ` per ${resolvedServiceType}` : ''}`,
                metadata: { studioId: params.id, appointmentId: appointment.id },
            })
            if (ownerNotification) dispatchToUser(studio.owner_id, ownerNotification)
        }

        const clientNotification = await createNotification({
            userId: authenticatedUserId,
            type: 'studio_booking_created',
            title: 'Prenotazione inviata',
            message: `La tua prenotazione${resolvedServiceType ? ` per ${resolvedServiceType}` : ''} è stata inviata con stato ${appointment.status}`,
            metadata: { studioId: params.id, appointmentId: appointment.id },
        })
        if (clientNotification) dispatchToUser(authenticatedUserId, clientNotification)

        return withCors(NextResponse.json({
            id: appointment.id,
            studioId: appointment.studio_id,
            clientId: appointment.client_id,
            professionalId: appointment.professional_id,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            serviceType: appointment.service_type,
            appointmentTypeId: appointment.appointment_type_id,
            notes: appointment.notes,
            isExternalBlocker: appointment.is_external_blocker,
            createdAt: appointment.created_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
