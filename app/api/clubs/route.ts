export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabase } from '@/lib/supabase-browser'

// OPTIONS /api/clubs - CORS preflight
export async function OPTIONS() {
    return handleOptions()
}

// GET /api/clubs - Get all clubs or filter by sport/city/search
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sport = searchParams.get('sport')
        const city = searchParams.get('city')
        const search = searchParams.get('search')

        let query = supabase
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false })

        // Filter by sport (array contains)
        if (sport && sport !== 'all') {
            query = query.contains('sports', [sport])
        }

        // Filter by city (case-insensitive)
        if (city) {
            query = query.ilike('city', `%${city}%`)
        }

        // Search by name or description
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        const { data: clubs, error } = await query

        if (error) {
            console.error('Supabase GET clubs error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(clubs || []))

    } catch (err: any) {
        console.error('GET /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/clubs - Create a new club
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, sports, city, address, logoUrl, coverUrl, website, foundedYear, createdBy } = body

        if (!name || !sports || !city) {
            return withCors(NextResponse.json({ error: 'name, sports, and city required' }, { status: 400 }))
        }

        const creatorId = createdBy ? createdBy.toString() : null

        // Prepare club data (frontend camelCase → database snake_case)
        const newClub = {
            name,
            description: description || '',
            sports: Array.isArray(sports) ? sports : [sports],
            city,
            address: address || '',
            logo_url: logoUrl || null,
            cover_url: coverUrl || null,
            website: website || '',
            founded_year: foundedYear || null,
            followers_count: 0,
            members_count: 0,
            verified: false,
            created_by: creatorId,
        }

        // Insert club
        const { data: createdClub, error: clubError } = await supabase
            .from('clubs')
            .insert([newClub])
            .select()
            .single()

        if (clubError) {
            console.error('Supabase INSERT club error:', clubError)
            return withCors(NextResponse.json({ error: clubError.message }, { status: 500 }))
        }

        // If creator provided, add them as Admin member
        if (creatorId && createdClub) {
            // Check if already member
            const { data: existingMembership } = await supabase
                .from('club_memberships')
                .select('id')
                .eq('club_id', createdClub.id)
                .eq('user_id', creatorId)
                .eq('is_active', true)
                .single()

            if (!existingMembership) {
                const { error: membershipError } = await supabase
                    .from('club_memberships')
                    .insert([{
                        club_id: createdClub.id,
                        user_id: creatorId,
                        role: 'Admin',
                        position: '',
                        permissions: [
                            'create_opportunities',
                            'manage_applications',
                            'manage_members',
                            'edit_club_info'
                        ],
                        is_active: true,
                    }])

                if (membershipError) {
                    console.error('Membership creation error:', membershipError)
                    // Non blocchiamo la creazione del club per questo
                }
            }
        }

        return withCors(NextResponse.json(createdClub, { status: 201 }))

    } catch (err: any) {
        console.error('POST /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// PUT /api/clubs - Update a club
export async function PUT(request: Request) {
    try {
        const body = await request.json()

        if (!body.id) {
            return withCors(NextResponse.json({ error: 'ID required' }, { status: 400 }))
        }

        // Map frontend camelCase → database snake_case
        const updates: any = {
            updated_at: new Date().toISOString()
        }

        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) updates.description = body.description
        if (body.sports !== undefined) updates.sports = body.sports
        if (body.city !== undefined) updates.city = body.city
        if (body.address !== undefined) updates.address = body.address
        if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl
        if (body.coverUrl !== undefined) updates.cover_url = body.coverUrl
        if (body.website !== undefined) updates.website = body.website
        if (body.foundedYear !== undefined) updates.founded_year = body.foundedYear
        if (body.verified !== undefined) updates.verified = body.verified

        const { data: updated, error } = await supabase
            .from('clubs')
            .update(updates)
            .eq('id', body.id)
            .select()
            .single()

        if (error) {
            console.error('Supabase UPDATE club error:', error)
            if (error.code === 'PGRST116') {
                return withCors(NextResponse.json({ error: 'Club not found' }, { status: 404 }))
            }
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(updated))

    } catch (err: any) {
        console.error('PUT /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/clubs - Delete a club
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return withCors(NextResponse.json({ error: 'ID required' }, { status: 400 }))
        }

        const { error } = await supabase
            .from('clubs')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Supabase DELETE club error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))

    } catch (err: any) {
        console.error('DELETE /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
