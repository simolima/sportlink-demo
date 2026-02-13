export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/career-experiences?userId=xxx
// Recupera tutte le esperienze di un utente
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return withCors(
                NextResponse.json({ error: 'userId is required' }, { status: 400 })
            )
        }

        const { data: experiences, error } = await supabase
            .from('career_experiences')
            .select(`
                *,
                organization:sports_organizations(
                    id,
                    name,
                    country,
                    city
                ),
                position:lookup_positions(
                    id,
                    name,
                    sport
                )
            `)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('season', { ascending: false })

        if (error) {
            console.error('Error fetching experiences:', error)
            return withCors(
                NextResponse.json({ error: error.message }, { status: 500 })
            )
        }

        return withCors(NextResponse.json(experiences || []))
    } catch (err: any) {
        console.error('Unexpected error in GET /api/career-experiences:', err)
        return withCors(
            NextResponse.json({ error: err.message }, { status: 500 })
        )
    }
}

// POST /api/career-experiences
// Crea o aggiorna esperienze (upsert multiplo)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, experiences } = body

        if (!userId || !Array.isArray(experiences)) {
            return withCors(
                NextResponse.json(
                    { error: 'userId and experiences array are required' },
                    { status: 400 }
                )
            )
        }

        // Per ogni esperienza, dobbiamo:
        // 1. Trovare o creare l'organization
        // 2. Salvare l'esperienza

        const savedExperiences = []

        for (const exp of experiences) {
            // 1. Trova o crea l'organizzazione
            const orgName = exp.team?.trim()
            const orgCountry = exp.country?.trim() || 'Italia'
            const orgCity = exp.city?.trim() || ''
            const orgSport = exp.sport?.trim() || 'Calcio' // Default Calcio

            if (!orgName) {
                console.warn('Skipping experience without team name:', exp)
                continue
            }

            // Cerca se l'organizzazione esiste già
            let { data: existingOrg } = await supabase
                .from('sports_organizations')
                .select('id')
                .eq('name', orgName)
                .eq('country', orgCountry)
                .eq('sport', orgSport)
                .maybeSingle()

            let organizationId = existingOrg?.id

            // Se non esiste, creala
            if (!organizationId) {
                const { data: newOrg, error: orgError } = await supabase
                    .from('sports_organizations')
                    .insert({
                        name: orgName,
                        country: orgCountry,
                        city: orgCity,
                        sport: orgSport,
                    })
                    .select('id')
                    .single()

                if (orgError) {
                    console.error('Error creating organization:', orgError)
                    continue
                }

                organizationId = newOrg.id
            }

            // 2. Prepara i dati dell'esperienza mappando i campi del form ai campi DB
            const expData: any = {
                user_id: userId,
                organization_id: organizationId,
                role: exp.role || 'Player',
                role_detail: exp.positionDetail || exp.primaryPosition || null,
                season: exp.season,
                category: exp.category || 'Non specificato',
                competition_type: exp.competitionType || 'male',
                start_date: exp.from || null,
                end_date: exp.to || null,
                is_current: exp.isCurrentlyPlaying || false,
            }

            // Aggiungi statistiche giocatore se role = Player
            if (exp.role === 'Player') {
                expData.goals = exp.goals || 0
                expData.assists = exp.assists || 0
                expData.clean_sheets = exp.cleanSheets || 0
                expData.appearances = exp.appearances || 0
                expData.minutes_played = exp.minutesPlayed || 0
                expData.penalties = exp.penalties || 0
                expData.yellow_cards = exp.yellowCards || 0
                expData.red_cards = exp.redCards || 0
                expData.substitutions_in = exp.substitutionsIn || 0
                expData.substitutions_out = exp.substitutionsOut || 0
                expData.points_per_game = exp.pointsPerGame || 0
                expData.rebounds = exp.rebounds || 0
                expData.aces = exp.volleyAces || 0
                expData.blocks = exp.volleyBlocks || 0
                expData.digs = exp.volleyDigs || 0
            }

            // Aggiungi statistiche coach se role = Coach
            if (exp.role === 'Coach') {
                expData.matches_coached = exp.matchesCoached || 0
                expData.wins = exp.wins || 0
                expData.draws = exp.draws || 0
                expData.losses = exp.losses || 0
                expData.trophies = exp.trophies || 0
            }

            // Se l'esperienza ha già un ID UUID, fai upsert
            if (exp.id && exp.id.length > 20) {
                expData.id = exp.id
                expData.updated_at = new Date().toISOString()

                const { data, error } = await supabase
                    .from('career_experiences')
                    .upsert(expData)
                    .select()
                    .single()

                if (error) {
                    console.error('Error upserting experience:', error)
                    continue
                }

                savedExperiences.push(data)
            } else {
                // Altrimenti, inserisci nuovo record
                const { data, error } = await supabase
                    .from('career_experiences')
                    .insert(expData)
                    .select()
                    .single()

                if (error) {
                    console.error('Error inserting experience:', error)
                    continue
                }

                savedExperiences.push(data)
            }
        }

        return withCors(
            NextResponse.json({
                success: true,
                count: savedExperiences.length,
                experiences: savedExperiences
            })
        )
    } catch (err: any) {
        console.error('Unexpected error in POST /api/career-experiences:', err)
        return withCors(
            NextResponse.json({ error: err.message }, { status: 500 })
        )
    }
}

// DELETE /api/career-experiences?id=xxx
// Soft delete di un'esperienza
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return withCors(
                NextResponse.json({ error: 'id is required' }, { status: 400 })
            )
        }

        const { error } = await supabase
            .from('career_experiences')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            console.error('Error deleting experience:', error)
            return withCors(
                NextResponse.json({ error: error.message }, { status: 500 })
            )
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        console.error('Unexpected error in DELETE /api/career-experiences:', err)
        return withCors(
            NextResponse.json({ error: err.message }, { status: 500 })
        )
    }
}

// OPTIONS handler per CORS preflight
export async function OPTIONS(req: NextRequest) {
    return withCors(new NextResponse(null, { status: 204 }))
}
