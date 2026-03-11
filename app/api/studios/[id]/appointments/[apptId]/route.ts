export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { deleteEvent, updateEvent } from '@/lib/google-calendar-service'
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

export async function OPTIONS() {
    return handleOptions()
}

// PATCH /api/studios/[id]/appointments/[apptId] — cambia status appuntamento
// - Owner: può confermare, cancellare, completare
// - Client: può solo cancellare il proprio
export async function PATCH(
    req: Request,
    { params }: { params: { id: string; apptId: string } }
) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: appointment } = await supabase
            .from('studio_appointments')
            .select('id, client_id, professional_id, studio_id, status, google_event_id, start_time, end_time, service_type, notes')
            .eq('id', params.apptId)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .single()

        if (!appointment) {
            return withCors(NextResponse.json({ error: 'appointment not found' }, { status: 404 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('timezone')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        const studioTimezone = studio?.timezone || DEFAULT_STUDIO_TIMEZONE

        const isOwner = appointment.professional_id === authenticatedUserId
        const isClient = appointment.client_id === authenticatedUserId

        if (!isOwner && !isClient) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const { status, notes, startTime, endTime } = body

        if (!status && notes === undefined && !startTime && !endTime) {
            return withCors(NextResponse.json({ error: 'no_fields_to_update' }, { status: 400 }))
        }

        // Il client può solo cancellare
        if (isClient && !isOwner && status !== 'cancelled') {
            return withCors(NextResponse.json({ error: 'il cliente può solo cancellare la prenotazione' }, { status: 403 }))
        }

        if (isClient && !isOwner && (startTime || endTime)) {
            return withCors(NextResponse.json({ error: 'il cliente non può riprogrammare la prenotazione' }, { status: 403 }))
        }

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
        if (status && !validStatuses.includes(status)) {
            return withCors(NextResponse.json({ error: 'status non valido' }, { status: 400 }))
        }

        const updates: Record<string, any> = {}
        if (status) updates.status = status
        if (notes !== undefined) updates.notes = notes

        if ((startTime || endTime) && !isOwner) {
            return withCors(NextResponse.json({ error: 'solo il professionista può riprogrammare' }, { status: 403 }))
        }

        const resolvedStartTime = startTime ? normalizeInputDateTimeToUtcIso(String(startTime), studioTimezone) : appointment.start_time
        const resolvedEndTime = endTime ? normalizeInputDateTimeToUtcIso(String(endTime), studioTimezone) : appointment.end_time

        if (new Date(resolvedEndTime).getTime() <= new Date(resolvedStartTime).getTime()) {
            return withCors(NextResponse.json({ error: 'invalid_time_range' }, { status: 400 }))
        }

        if (startTime || endTime) {
            const sameTimeAsCurrent = resolvedStartTime === appointment.start_time && resolvedEndTime === appointment.end_time
            if (!sameTimeAsCurrent) {
                const { data: conflictingAppointments } = await supabase
                    .from('studio_appointments')
                    .select('id')
                    .eq('studio_id', params.id)
                    .is('deleted_at', null)
                    .in('status', ['pending', 'confirmed'])
                    .neq('id', params.apptId)
                    .lt('start_time', resolvedEndTime)
                    .gt('end_time', resolvedStartTime)

                const { data: conflictingExternalEvents } = await supabase
                    .from('studio_external_events')
                    .select('id')
                    .eq('professional_studio_id', params.id)
                    .is('deleted_at', null)
                    .lt('start_time', resolvedEndTime)
                    .gt('end_time', resolvedStartTime)

                if ((conflictingAppointments?.length || 0) > 0 || (conflictingExternalEvents?.length || 0) > 0) {
                    return withCors(NextResponse.json({ error: 'slot_not_available' }, { status: 409 }))
                }
            }

            updates.start_time = resolvedStartTime
            updates.end_time = resolvedEndTime
        }

        const { data: updated, error } = await supabase
            .from('studio_appointments')
            .update(updates)
            .eq('id', params.apptId)
            .select()
            .single()

        if (error) throw error

        if (status === 'cancelled' && appointment.google_event_id) {
            try {
                const selectedCalendarId = await getSelectedCalendarId(params.id)
                if (selectedCalendarId) {
                    await deleteEvent(params.id, selectedCalendarId, appointment.google_event_id)
                }
            } catch (syncError) {
                console.error('Failed to delete Google event on cancellation:', syncError)
            }
        } else if ((startTime || endTime || notes !== undefined) && appointment.google_event_id) {
            try {
                const selectedCalendarId = await getSelectedCalendarId(params.id)
                if (selectedCalendarId) {
                    await updateEvent(params.id, selectedCalendarId, appointment.google_event_id, {
                        summary: updated.service_type || 'Prenotazione Sprinta',
                        description: updated.notes || undefined,
                        start: updated.start_time,
                        end: updated.end_time,
                        timeZone: studioTimezone,
                    })
                    await supabase
                        .from('studio_appointments')
                        .update({ google_sync_status: 'synced' })
                        .eq('id', params.apptId)
                }
            } catch (syncError) {
                console.error('Failed to update Google event on appointment change:', syncError)
                await supabase
                    .from('studio_appointments')
                    .update({ google_sync_status: 'sync_failed' })
                    .eq('id', params.apptId)
            }
        }

        if (status && status !== appointment.status) {
            if (isOwner) {
                const clientNotification = await createNotification({
                    userId: appointment.client_id,
                    type: 'studio_booking_status_updated',
                    title: 'Aggiornamento prenotazione',
                    message: `La tua prenotazione è ora ${status}`,
                    metadata: { studioId: params.id, appointmentId: params.apptId, status },
                })
                if (clientNotification) dispatchToUser(appointment.client_id, clientNotification)
            } else if (isClient && status === 'cancelled') {
                const ownerNotification = await createNotification({
                    userId: appointment.professional_id,
                    type: 'studio_booking_cancelled_by_client',
                    title: 'Prenotazione annullata',
                    message: 'Un cliente ha annullato una prenotazione',
                    metadata: { studioId: params.id, appointmentId: params.apptId },
                })
                if (ownerNotification) dispatchToUser(appointment.professional_id, ownerNotification)
            }
        }

        return withCors(NextResponse.json({
            id: updated.id,
            studioId: updated.studio_id,
            clientId: updated.client_id,
            professionalId: updated.professional_id,
            startTime: updated.start_time,
            endTime: updated.end_time,
            status: updated.status,
            serviceType: updated.service_type,
            appointmentTypeId: updated.appointment_type_id,
            notes: updated.notes,
            updatedAt: updated.updated_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/studios/[id]/appointments/[apptId] — soft delete (solo owner)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string; apptId: string } }
) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: appointment } = await supabase
            .from('studio_appointments')
            .select('professional_id, studio_id, google_event_id')
            .eq('id', params.apptId)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .single()

        if (!appointment) {
            return withCors(NextResponse.json({ error: 'appointment not found' }, { status: 404 }))
        }
        if (appointment.professional_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const { error } = await supabase
            .from('studio_appointments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', params.apptId)

        if (error) throw error

        if (appointment.google_event_id) {
            try {
                const selectedCalendarId = await getSelectedCalendarId(params.id)
                if (selectedCalendarId) {
                    await deleteEvent(params.id, selectedCalendarId, appointment.google_event_id)
                }
            } catch (syncError) {
                console.error('Failed to delete Google event on appointment delete:', syncError)
            }
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
