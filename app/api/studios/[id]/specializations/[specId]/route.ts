export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// PATCH /api/studios/[id]/specializations/[specId] — solo owner
export async function PATCH(req: Request, { params }: { params: { id: string; specId: string } }) {
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

        if (!studio || studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const updates: Record<string, any> = {}

        if (body.name !== undefined) {
            const name = body.name?.toString?.()?.trim()
            if (!name) {
                return withCors(NextResponse.json({ error: 'name_cannot_be_empty' }, { status: 400 }))
            }
            updates.name = name
        }
        if (body.description !== undefined) {
            updates.description = body.description?.toString?.()?.trim() || null
        }
        if (body.icon !== undefined) {
            updates.icon = body.icon?.toString?.()?.trim() || null
        }
        if (body.displayOrder !== undefined) {
            updates.display_order = Number(body.displayOrder ?? 0)
        }

        if (Object.keys(updates).length === 0) {
            return withCors(NextResponse.json({ error: 'no_valid_fields_to_update' }, { status: 400 }))
        }

        const { data: updated, error } = await supabase
            .from('studio_specializations')
            .update(updates)
            .eq('id', params.specId)
            .eq('studio_id', params.id)
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: updated.id,
            studioId: updated.studio_id,
            name: updated.name,
            description: updated.description,
            icon: updated.icon,
            displayOrder: updated.display_order,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/studios/[id]/specializations/[specId] — solo owner (soft-delete)
export async function DELETE(req: Request, { params }: { params: { id: string; specId: string } }) {
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

        if (!studio || studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const { error } = await supabase
            .from('studio_specializations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', params.specId)
            .eq('studio_id', params.id)

        if (error) throw error

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
