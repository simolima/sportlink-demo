export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/sports-organizations?q=search&sport=Calcio
// Se `q` è presente usa la ricerca per similarità (pg_trgm), altrimenti lista completa
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const sport = searchParams.get('sport')

        // ── Ricerca fuzzy tramite pg_trgm (RPC) ──────────────────────────────
        if (query && query.trim().length >= 2) {
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('search_organizations_similar', {
                    search_name: query.trim(),
                    threshold: 0.2,   // soglia bassa: cattura anche "AC Milan" → "AC Milano"
                    max_results: 8,
                })

            if (rpcError) {
                console.error('RPC search error:', rpcError)
                // Fallback a ilike se la RPC non è ancora disponibile (migration non ancora applicata)
                const { data: fallback } = await supabase
                    .from('sports_organizations')
                    .select('id, name, country, city, sport_id')
                    .is('deleted_at', null)
                    .ilike('name', `%${query.trim()}%`)
                    .limit(8)
                return withCors(NextResponse.json(fallback || []))
            }

            // Se richiesto, filtra anche per sport
            let results = rpcData || []
            if (sport) {
                const { data: sportRow } = await supabase
                    .from('lookup_sports').select('id').ilike('name', sport).maybeSingle()
                if (sportRow) {
                    results = results.filter((o: any) => String(o.sport_id) === String(sportRow.id))
                }
            }

            return withCors(NextResponse.json(results))
        }

        // ── Lista completa (senza query) ──────────────────────────────────────
        let dbQuery = supabase
            .from('sports_organizations')
            .select('id, name, country, city, sport_id')
            .is('deleted_at', null)
            .order('name')

        if (sport) {
            const { data: sportRow } = await supabase
                .from('lookup_sports').select('id').ilike('name', sport).maybeSingle()
            if (sportRow) dbQuery = dbQuery.eq('sport_id', sportRow.id)
        }

        const { data, error } = await dbQuery.limit(20)
        if (error) {
            console.error('Error fetching organizations:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data || []))
    } catch (error) {
        console.error('Unexpected error:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// POST /api/sports-organizations
// Crea una nuova organizzazione (chiamata dall'API clubs quando l'utente rifiuta il collegamento)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, country, city, sportId } = body

        if (!name || !country) {
            return withCors(NextResponse.json(
                { error: 'Missing required fields: name, country' },
                { status: 400 }
            ))
        }

        const { data, error } = await supabase
            .from('sports_organizations')
            .insert({ name, country, city: city || null, sport_id: sportId || null })
            .select('id, name, country, city, sport_id')
            .single()

        if (error) {
            // Conflict: esiste già (unique constraint) → restituisce l'esistente
            if (error.code === '23505') {
                const { data: existing } = await supabase
                    .from('sports_organizations')
                    .select('id, name, country, city, sport_id')
                    .eq('name', name)
                    .eq('country', country)
                    .maybeSingle()
                if (existing) return withCors(NextResponse.json(existing, { status: 200 }))
            }
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
