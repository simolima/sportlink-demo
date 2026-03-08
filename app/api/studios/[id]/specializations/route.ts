export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id]/specializations
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { data, error } = await supabase
            .from('studio_specializations')
            .select('*')
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) throw error

        const result = (data || []).map((s: any) => ({
            id: s.id,
            studioId: s.studio_id,
            name: s.name,
            description: s.description ?? undefined,
            icon: s.icon ?? undefined,
            displayOrder: s.display_order ?? 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/studios/[id]/specializations — solo owner
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
        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const name = body?.name?.toString?.()?.trim()
        const description = body?.description?.toString?.()?.trim() || null
        const icon = body?.icon?.toString?.()?.trim() || null
        const displayOrder = Number(body?.displayOrder ?? 0)

        if (!name) {
            return withCors(NextResponse.json({ error: 'name_required' }, { status: 400 }))
        }

        const { data: inserted, error } = await supabase
            .from('studio_specializations')
            .insert({
                studio_id: params.id,
                name,
                description,
                icon,
                display_order: displayOrder,
            })
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: inserted.id,
            studioId: inserted.studio_id,
            name: inserted.name,
            description: inserted.description,
            icon: inserted.icon,
            displayOrder: inserted.display_order,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
