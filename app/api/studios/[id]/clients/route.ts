export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id]/clients — lista clienti (solo owner)
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        // Verifica ownership
        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }
        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const { data, error } = await supabase
            .from('studio_clients')
            .select(`
                *,
                client:profiles!client_profile_id(
                    id, first_name, last_name, avatar_url, role_id
                )
            `)
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (error) throw error

        const result = (data || []).map((c: any) => ({
            id: c.id,
            studioId: c.studio_id,
            clientProfileId: c.client_profile_id,
            status: c.status,
            notes: c.notes,
            onboardedAt: c.onboarded_at,
            createdAt: c.created_at,
            client: c.client ? {
                id: c.client.id,
                firstName: c.client.first_name,
                lastName: c.client.last_name,
                avatarUrl: c.client.avatar_url,
                roleId: c.client.role_id,
            } : undefined,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// PATCH /api/studios/[id]/clients — aggiorna status cliente (solo owner)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const { clientId, status, notes } = body

        if (!clientId) {
            return withCors(NextResponse.json({ error: 'clientId is required' }, { status: 400 }))
        }

        const updates: Record<string, any> = {}
        if (status !== undefined) updates.status = status
        if (notes !== undefined) updates.notes = notes
        if (status === 'active' && !updates.onboarded_at) {
            updates.onboarded_at = new Date().toISOString().split('T')[0]
        }

        const { data: updated, error } = await supabase
            .from('studio_clients')
            .update(updates)
            .eq('studio_id', params.id)
            .eq('client_profile_id', clientId)
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: updated.id,
            studioId: updated.studio_id,
            clientProfileId: updated.client_profile_id,
            status: updated.status,
            notes: updated.notes,
            onboardedAt: updated.onboarded_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
