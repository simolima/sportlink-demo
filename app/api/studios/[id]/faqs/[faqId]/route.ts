export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// PATCH /api/studios/[id]/faqs/[faqId] — solo owner
export async function PATCH(req: Request, { params }: { params: { id: string; faqId: string } }) {
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

        if (body.question !== undefined) {
            const question = body.question?.toString?.()?.trim()
            if (!question) {
                return withCors(NextResponse.json({ error: 'question_cannot_be_empty' }, { status: 400 }))
            }
            updates.question = question
        }
        if (body.answer !== undefined) {
            const answer = body.answer?.toString?.()?.trim()
            if (!answer) {
                return withCors(NextResponse.json({ error: 'answer_cannot_be_empty' }, { status: 400 }))
            }
            updates.answer = answer
        }
        if (body.displayOrder !== undefined) {
            updates.display_order = Number(body.displayOrder ?? 0)
        }

        if (Object.keys(updates).length === 0) {
            return withCors(NextResponse.json({ error: 'no_valid_fields_to_update' }, { status: 400 }))
        }

        const { data: updated, error } = await supabase
            .from('studio_faqs')
            .update(updates)
            .eq('id', params.faqId)
            .eq('studio_id', params.id)
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: updated.id,
            studioId: updated.studio_id,
            question: updated.question,
            answer: updated.answer,
            displayOrder: updated.display_order,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/studios/[id]/faqs/[faqId] — solo owner (soft-delete)
export async function DELETE(req: Request, { params }: { params: { id: string; faqId: string } }) {
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
            .from('studio_faqs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', params.faqId)
            .eq('studio_id', params.id)

        if (error) throw error

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
