/**
 * API Route: /api/opportunities
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Tables: public.opportunities + public.clubs (join) + public.applications (count)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/opportunities
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sport = searchParams.get('sport')
        const clubId = searchParams.get('clubId')
        const city = searchParams.get('city')
        const search = searchParams.get('search')
        const activeOnly = searchParams.get('activeOnly') !== 'false'

        let query = supabaseServer
            .from('opportunities')
            .select(`
                *,
                clubs:club_id (id, name, logo_url, is_verified)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        // Active filter
        if (activeOnly) {
            query = query
                .eq('status', 'open')
                .gte('expiry_date', new Date().toISOString().split('T')[0])
        }

        if (sport && sport !== 'all') {
            // sport_id is bigint — need to find the sport ID first or filter client-side
            // For now, filter client-side since the frontend sends sport names
        }

        if (clubId) {
            query = query.eq('club_id', clubId)
        }

        if (city) {
            query = query.ilike('city', `%${city}%`)
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
        }

        const { data: opportunities, error } = await query

        if (error) {
            console.error('GET /api/opportunities error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Get application counts per opportunity
        const oppIds = (opportunities || []).map((o: any) => o.id)
        let appCounts: Record<string, number> = {}

        if (oppIds.length > 0) {
            const { data: apps } = await supabaseServer
                .from('applications')
                .select('opportunity_id')
                .in('opportunity_id', oppIds)
                .is('deleted_at', null)

            if (apps) {
                for (const app of apps) {
                    appCounts[app.opportunity_id] = (appCounts[app.opportunity_id] || 0) + 1
                }
            }
        }

        // Map to frontend format
        const enriched = (opportunities || []).map((opp: any) => ({
            id: opp.id,
            clubId: opp.club_id,
            title: opp.title,
            description: opp.description,
            type: opp.role_id, // role_id maps to the "type" the frontend expects
            sport: '', // Would need lookup_sports join
            roleRequired: opp.role_id,
            position: opp.position_id,
            location: opp.location || opp.city || '',
            city: opp.city || '',
            salary: opp.salary_range || '',
            contractType: opp.contract_type || '',
            expiryDate: opp.expiry_date,
            isActive: opp.status === 'open',
            status: opp.status,
            createdBy: opp.created_by,
            createdAt: opp.created_at,
            club: opp.clubs ? {
                id: opp.clubs.id,
                name: opp.clubs.name,
                logoUrl: opp.clubs.logo_url,
                verified: opp.clubs.is_verified,
            } : null,
            applicationsCount: appCounts[opp.id] || 0,
        }))

        return withCors(NextResponse.json(enriched))
    } catch (err) {
        console.error('GET /api/opportunities exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}

// POST /api/opportunities — Create new
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const required = ['clubId', 'title', 'description', 'expiryDate', 'createdBy']
        for (const field of required) {
            if (!body[field]) {
                return withCors(NextResponse.json({ error: `${field} is required` }, { status: 400 }))
            }
        }

        const { data, error } = await supabaseServer
            .from('opportunities')
            .insert({
                club_id: body.clubId,
                created_by: body.createdBy,
                title: body.title,
                description: body.description,
                sport_id: body.sportId || body.sport_id || 1, // Default to first sport
                role_id: body.roleRequired || body.type || 'player',
                position_id: body.positionId || null,
                salary_range: body.salary || body.salaryRange || null,
                contract_type: body.contractType || null,
                city: body.city || body.location || null,
                location: body.location || null,
                expiry_date: body.expiryDate,
                status: 'open',
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/opportunities error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({
            id: data.id,
            clubId: data.club_id,
            title: data.title,
            createdAt: data.created_at,
            status: data.status,
        }, { status: 201 }))
    } catch (err) {
        console.error('POST /api/opportunities exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// PUT /api/opportunities — Update
export async function PUT(request: Request) {
    try {
        const body = await request.json()

        if (!body.id) {
            return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
        }

        const updateData: Record<string, any> = {}
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.city !== undefined) updateData.city = body.city
        if (body.location !== undefined) updateData.location = body.location
        if (body.salary !== undefined) updateData.salary_range = body.salary
        if (body.contractType !== undefined) updateData.contract_type = body.contractType
        if (body.expiryDate !== undefined) updateData.expiry_date = body.expiryDate
        if (body.status !== undefined) updateData.status = body.status
        if (body.isActive !== undefined) updateData.status = body.isActive ? 'open' : 'closed'

        const { data, error } = await supabaseServer
            .from('opportunities')
            .update(updateData)
            .eq('id', body.id)
            .select()
            .single()

        if (error) {
            console.error('PUT /api/opportunities error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data))
    } catch (err) {
        console.error('PUT /api/opportunities exception:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE /api/opportunities?id=X — Soft delete
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const { error } = await supabaseServer
        .from('opportunities')
        .update({ deleted_at: new Date().toISOString(), status: 'archived' })
        .eq('id', id)

    if (error) {
        console.error('DELETE /api/opportunities error:', error)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withCors(NextResponse.json({ success: true }))
}
