/**
 * API Route: /api/applications
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Tables: public.applications + public.opportunities (join) + public.profiles (join) + public.clubs (join)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/applications
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const opportunityId = searchParams.get('opportunityId')
        const applicantId = searchParams.get('applicantId')
        const agentId = searchParams.get('agentId')
        const clubId = searchParams.get('clubId')
        const status = searchParams.get('status')

        let query = supabaseServer
            .from('applications')
            .select(`
                *,
                opportunity:opportunity_id (
                    id, title, role_id, sport_id, city,
                    club:club_id (id, name, logo_url)
                ),
                applicant:applicant_id (
                    id, first_name, last_name, avatar_url, role_id
                ),
                agent_profile:agent_id (
                    id, first_name, last_name, avatar_url
                )
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (opportunityId) {
            query = query.eq('opportunity_id', opportunityId)
        }
        if (applicantId) {
            query = query.eq('applicant_id', applicantId)
        }
        if (agentId) {
            query = query.eq('agent_id', agentId)
        }
        if (status) {
            query = query.eq('status', status)
        } else {
            query = query.neq('status', 'withdrawn')
        }

        // Filter by club (via opportunity)
        // Handled client-side below if clubId is specified

        const { data, error } = await query

        if (error) {
            console.error('GET /api/applications error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        let results = (data || []).map((app: any) => ({
            id: app.id,
            opportunityId: app.opportunity_id,
            applicantId: app.applicant_id,
            agentId: app.agent_id,
            status: app.status,
            message: app.message || '',
            appliedAt: app.created_at,
            updatedAt: app.updated_at,
            opportunity: app.opportunity ? {
                id: app.opportunity.id,
                title: app.opportunity.title,
                type: app.opportunity.role_id,
                sport: '',
                club: app.opportunity.club ? {
                    id: app.opportunity.club.id,
                    name: app.opportunity.club.name,
                    logoUrl: app.opportunity.club.logo_url,
                } : null,
            } : null,
            player: app.applicant ? {
                id: app.applicant.id,
                firstName: app.applicant.first_name,
                lastName: app.applicant.last_name,
                avatarUrl: app.applicant.avatar_url,
                professionalRole: app.applicant.role_id,
            } : null,
            agent: app.agent_profile ? {
                id: app.agent_profile.id,
                firstName: app.agent_profile.first_name,
                lastName: app.agent_profile.last_name,
                avatarUrl: app.agent_profile.avatar_url,
            } : null,
        }))

        // Filter by club
        if (clubId) {
            results = results.filter((app: any) =>
                app.opportunity?.club?.id === clubId
            )
        }

        return withCors(NextResponse.json(results))
    } catch (err) {
        console.error('GET /api/applications exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/applications — Create new application
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { opportunityId, applicantId, agentId, message } = body

        if (!opportunityId || !applicantId) {
            return withCors(NextResponse.json({ error: 'opportunityId and applicantId required' }, { status: 400 }))
        }

        // Check if already applied
        const { data: existing } = await supabaseServer
            .from('applications')
            .select('id')
            .eq('opportunity_id', opportunityId)
            .eq('applicant_id', applicantId)
            .neq('status', 'withdrawn')
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Already applied to this opportunity' }, { status: 400 }))
        }

        const { data: newApp, error } = await supabaseServer
            .from('applications')
            .insert({
                opportunity_id: opportunityId,
                applicant_id: applicantId,
                agent_id: agentId || null,
                status: 'pending',
                message: message || '',
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/applications error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Create notification for opportunity creator
        try {
            const { data: opportunity } = await supabaseServer
                .from('opportunities')
                .select('id, title, created_by')
                .eq('id', opportunityId)
                .single()

            const { data: applicant } = await supabaseServer
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', applicantId)
                .single()

            if (opportunity && applicant && opportunity.created_by) {
                const applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 'Un candidato'
                const oppTitle = opportunity.title || 'un annuncio'

                await supabaseServer.from('notifications').insert({
                    user_id: opportunity.created_by,
                    type: 'new_application',
                    title: 'Nuova candidatura',
                    message: `${applicantName} si è candidato al tuo annuncio "${oppTitle}".`,
                    metadata: {
                        applicantId: applicant.id,
                        applicantName,
                        applicantAvatar: applicant.avatar_url || null,
                        opportunityId: opportunity.id,
                        opportunityTitle: oppTitle,
                    },
                    is_read: false,
                })
            }
        } catch (notifErr) {
            console.error('Application notification failed:', notifErr)
        }

        return withCors(NextResponse.json({
            id: newApp.id,
            opportunityId: newApp.opportunity_id,
            applicantId: newApp.applicant_id,
            status: newApp.status,
            appliedAt: newApp.created_at,
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/applications exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// PUT /api/applications — Update status
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, status, reviewedBy } = body

        if (!id || !status) {
            return withCors(NextResponse.json({ error: 'id and status required' }, { status: 400 }))
        }

        // Get current application
        const { data: current } = await supabaseServer
            .from('applications')
            .select('status, applicant_id, opportunity_id')
            .eq('id', id)
            .single()

        if (!current) {
            return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }))
        }

        const updateData: Record<string, any> = { status }
        // reviewedBy not in schema — skip or store in metadata

        const { data, error } = await supabaseServer
            .from('applications')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('PUT /api/applications error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Notify applicant about status change
        if ((status === 'accepted' || status === 'rejected') && current.status !== status) {
            try {
                const { data: opportunity } = await supabaseServer
                    .from('opportunities')
                    .select('id, title')
                    .eq('id', current.opportunity_id)
                    .single()

                const oppTitle = opportunity?.title || 'un annuncio'
                const type = status === 'accepted' ? 'candidacy_accepted' : 'candidacy_rejected'
                const title = status === 'accepted' ? 'Candidatura accettata' : 'Candidatura rifiutata'

                await supabaseServer.from('notifications').insert({
                    user_id: current.applicant_id,
                    type,
                    title,
                    message: `La tua candidatura all'annuncio "${oppTitle}" è stata ${status === 'accepted' ? 'accettata' : 'rifiutata'}.`,
                    metadata: {
                        applicationId: id,
                        opportunityId: current.opportunity_id,
                        opportunityTitle: oppTitle,
                    },
                    is_read: false,
                })
            } catch (notifErr) {
                console.error('Candidacy status notification failed:', notifErr)
            }
        }

        return withCors(NextResponse.json(data))
    } catch (err) {
        console.error('PUT /api/applications exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE /api/applications?id=X&withdraw=true
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const withdraw = searchParams.get('withdraw') === 'true'

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    if (withdraw) {
        const { error } = await supabaseServer
            .from('applications')
            .update({ status: 'withdrawn' })
            .eq('id', id)

        if (error) {
            console.error('DELETE (withdraw) /api/applications error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }
        return withCors(NextResponse.json({ success: true, withdrawn: true }))
    }

    // Soft delete
    const { error } = await supabaseServer
        .from('applications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('DELETE /api/applications error:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withCors(NextResponse.json({ success: true }))
}
