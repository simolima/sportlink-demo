export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'
import { deleteEvent } from '@/lib/google-calendar-service'

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
            .select('id, client_id, professional_id, studio_id, status, google_event_id')
            .eq('id', params.apptId)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .single()

        if (!appointment) {
            return withCors(NextResponse.json({ error: 'appointment not found' }, { status: 404 }))
        }

        const isOwner = appointment.professional_id === authenticatedUserId
        const isClient = appointment.client_id === authenticatedUserId

        if (!isOwner && !isClient) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const { status, notes } = body

        // Il client può solo cancellare
        if (isClient && !isOwner && status !== 'cancelled') {
            return withCors(NextResponse.json({ error: 'il cliente può solo cancellare la prenotazione' }, { status: 403 }))
        }

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
        if (!validStatuses.includes(status)) {
            return withCors(NextResponse.json({ error: 'status non valido' }, { status: 400 }))
        }

        const updates: Record<string, any> = { status }
        if (notes !== undefined) updates.notes = notes

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
