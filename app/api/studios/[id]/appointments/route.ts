export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

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
            .select('owner_id')
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
        const { startTime, endTime, serviceType, notes } = body

        if (!startTime || !endTime) {
            return withCors(NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 }))
        }

        const { data: appointment, error } = await supabase
            .from('studio_appointments')
            .insert({
                studio_id: params.id,
                client_id: authenticatedUserId,
                professional_id: studio.owner_id,
                start_time: startTime,
                end_time: endTime,
                status: 'pending',
                service_type: serviceType || null,
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

        return withCors(NextResponse.json({
            id: appointment.id,
            studioId: appointment.studio_id,
            clientId: appointment.client_id,
            professionalId: appointment.professional_id,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            serviceType: appointment.service_type,
            notes: appointment.notes,
            isExternalBlocker: appointment.is_external_blocker,
            createdAt: appointment.created_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
