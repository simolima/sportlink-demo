export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id]/faqs
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { data, error } = await supabase
            .from('studio_faqs')
            .select('*')
            .eq('studio_id', params.id)
            .is('deleted_at', null)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) throw error

        const result = (data || []).map((f: any) => ({
            id: f.id,
            studioId: f.studio_id,
            question: f.question,
            answer: f.answer,
            displayOrder: f.display_order ?? 0,
            createdAt: f.created_at,
            updatedAt: f.updated_at,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/studios/[id]/faqs — solo owner
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
        const question = body?.question?.toString?.()?.trim()
        const answer = body?.answer?.toString?.()?.trim()
        const displayOrder = Number(body?.displayOrder ?? 0)

        if (!question) {
            return withCors(NextResponse.json({ error: 'question_required' }, { status: 400 }))
        }
        if (!answer) {
            return withCors(NextResponse.json({ error: 'answer_required' }, { status: 400 }))
        }

        const { data: inserted, error } = await supabase
            .from('studio_faqs')
            .insert({
                studio_id: params.id,
                question,
                answer,
                display_order: displayOrder,
            })
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: inserted.id,
            studioId: inserted.studio_id,
            question: inserted.question,
            answer: inserted.answer,
            displayOrder: inserted.display_order,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
