import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/organization-requests?status=pending&userId=xxx
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const userId = searchParams.get('userId')

        let query = supabase
            .from('organization_requests')
            .select(`
        *,
        requested_by_profile:profiles!requested_by(id, first_name, last_name, avatar_url),
        reviewed_by_profile:profiles!reviewed_by(id, first_name, last_name)
      `)
            .order('requested_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        if (userId) {
            query = query.eq('requested_by', userId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching requests:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/organization-requests (richiesta da utente)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { requested_name, requested_country, requested_city, requested_sport, additional_info, requested_by } = body

        if (!requested_name || !requested_country || !requested_sport || !requested_by) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Verifica se organizzazione esiste già
        const { data: existing } = await supabase
            .from('sports_organizations')
            .select('id, name')
            .eq('name', requested_name)
            .eq('country', requested_country)
            .eq('sport', requested_sport)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { error: 'Organization already exists', organization: existing },
                { status: 409 }
            )
        }

        const { data, error } = await supabase
            .from('organization_requests')
            .insert({
                requested_name,
                requested_country,
                requested_city,
                requested_sport,
                additional_info,
                requested_by,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating request:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
