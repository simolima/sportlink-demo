export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const studioId = params.id

        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return withCors(NextResponse.json({ error: 'studio_not_found' }, { status: 404 }))
        }

        if (String(studio.owner_id) !== String(authenticatedUserId)) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const [{ data: appointments, error: appointmentsError }, { data: externalEvents, error: externalEventsError }] = await Promise.all([
            supabaseServer
                .from('studio_appointments')
                .select('id, start_time, end_time, status, service_type, is_external_blocker, client_id, client:profiles!client_id(first_name, last_name)')
                .eq('studio_id', studioId)
                .is('deleted_at', null),
            supabaseServer
                .from('studio_external_events')
                .select('id, google_event_id, start_time, end_time, summary, is_all_day')
                .eq('professional_studio_id', studioId)
                .is('deleted_at', null),
        ])

        if (appointmentsError) {
            throw appointmentsError
        }

        if (externalEventsError) {
            throw externalEventsError
        }

        const appointmentItems = (appointments || []).map((item: any) => {
            const clientName = item?.client
                ? `${item.client.first_name || ''} ${item.client.last_name || ''}`.trim() || 'Cliente'
                : 'Cliente'
            const isBlocker = !!item.is_external_blocker
            return {
                id: `appointment:${item.id}`,
                title: isBlocker ? (item.service_type || 'Occupato personale') : `${item.service_type || 'Prenotazione'} - ${clientName}`,
                start: item.start_time,
                end: item.end_time,
                allDay: false,
                type: isBlocker ? 'blocker' : 'appointment',
                status: item.status,
                backgroundColor: isBlocker ? '#9CA3AF' : '#2341F0',
                borderColor: isBlocker ? '#6B7280' : '#1D33C7',
                textColor: '#ffffff',
            }
        })

        const externalItems = (externalEvents || []).map((item: any) => ({
            id: `external:${item.id}`,
            title: item.summary || 'Evento esterno',
            start: item.start_time,
            end: item.end_time,
            allDay: !!item.is_all_day,
            type: 'external',
            status: 'busy',
            backgroundColor: '#D1D5DB',
            borderColor: '#9CA3AF',
            textColor: '#111827',
            googleEventId: item.google_event_id,
        }))

        return withCors(NextResponse.json({ events: [...appointmentItems, ...externalItems] }))
    } catch (error: any) {
        console.error('Error loading calendar events:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
