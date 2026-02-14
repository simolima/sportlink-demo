export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors } from '@/lib/cors'

// GET: Leggi dati fisici di un utente
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return withCors(NextResponse.json({ error: 'userId_required' }, { status: 400 }))
        }

        const { data, error } = await supabaseServer
            .from('physical_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching physical stats:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data || null))
    } catch (err: any) {
        console.error('GET /api/physical-stats error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST/PUT: Upsert dei dati fisici
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, height_cm, weight_kg, dominant_foot, dominant_hand } = body

        console.log('🔍 POST /api/physical-stats - userId:', userId, 'data:', { height_cm, weight_kg, dominant_foot, dominant_hand })

        if (!userId) {
            return withCors(NextResponse.json({ error: 'userId_required' }, { status: 400 }))
        }

        // Validazione campi
        if (height_cm !== undefined && height_cm !== null) {
            if (height_cm < 50 || height_cm > 300) {
                return withCors(NextResponse.json({ error: 'height_invalid' }, { status: 400 }))
            }
        }

        if (weight_kg !== undefined && weight_kg !== null) {
            if (weight_kg < 20 || weight_kg > 300) {
                return withCors(NextResponse.json({ error: 'weight_invalid' }, { status: 400 }))
            }
        }

        // Upsert: inserisci o aggiorna se esiste già
        console.log('🚀 Executing UPSERT on physical_stats...')
        console.log('🔑 Using service role?', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { data, error } = await supabaseServer
            .from('physical_stats')
            .upsert({
                user_id: userId,
                height_cm: height_cm || null,
                weight_kg: weight_kg || null,
                dominant_foot: dominant_foot || null,
                dominant_hand: dominant_hand || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id' // primary key
            })
            .select()
            .maybeSingle()

        console.log('📊 UPSERT result - error:', error, 'data:', data ? 'OK' : 'NULL')

        if (error) {
            console.error('❌ Error upserting physical stats:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        console.log('✅ Physical stats saved successfully')
        return withCors(NextResponse.json(data))
    } catch (err: any) {
        console.error('POST /api/physical-stats error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
