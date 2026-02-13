export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/sports-organizations?q=search&sport=Calcio&country=Italia
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const sport = searchParams.get('sport')

        let dbQuery = supabase
            .from('sports_organizations')
            .select('*')
            .is('deleted_at', null)
            .order('name')

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`)
        }

        if (sport) {
            dbQuery = dbQuery.eq('sport', sport)
        }

        const { data, error } = await dbQuery.limit(20)

        if (error) {
            console.error('Error fetching organizations:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data))
    } catch (error) {
        console.error('Unexpected error:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// POST /api/sports-organizations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, country, city, sport } = body

        if (!name || !country || !sport) {
            return withCors(NextResponse.json(
                { error: 'Missing required fields: name, country, sport' },
                { status: 400 }
            ))
        }

        const { data, error } = await supabase
            .from('sports_organizations')
            .insert({
                name,
                country,
                city,
                sport
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating organization:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data, { status: 201 }))
    } catch (error) {
        console.error('Unexpected error:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// OPTIONS handler per CORS preflight
export async function OPTIONS(request: NextRequest) {
    return withCors(new NextResponse(null, { status: 204 }))
}
