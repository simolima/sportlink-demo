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
                    city,
                    sport
                ),
                position:lookup_positions(
                    id,
                    name,
                    category
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
        // 1. Trovare l'organization (SOLO LETTURA - no auto-creazione)
        // 2. Salvare l'esperienza

        const savedExperiences = []
        const errors = []

        for (const exp of experiences) {
            // 0. Validazione campi obbligatori
            const orgName = exp.team?.trim()
            const orgCountry = exp.country?.trim() || 'Italia'
            const orgSport = exp.sport?.trim() || 'Calcio'
            const season = exp.season?.trim()

            // Validazione: team obbligatorio
            if (!orgName) {
                errors.push({
                    experience: { season: season || '?', team: 'N/A', category: exp.category },
                    error: 'Campo "Organizzazione/Club" obbligatorio'
                })
                console.warn('Skipping experience without team name:', exp)
                continue
            }

            // Validazione: season obbligatoria
            if (!season) {
                errors.push({
                    experience: { season: 'N/A', team: orgName, category: exp.category },
                    error: 'Campo "Stagione" obbligatorio (es: 2024/2025)'
                })
                console.warn('Skipping experience without season:', exp)
                continue
            }

            // 1. Cerca l'organizzazione nel database
            const { data: existingOrg } = await supabase
                .from('sports_organizations')
                .select('id')
                .eq('name', orgName)
                .eq('country', orgCountry)
                .eq('sport', orgSport)
                .maybeSingle()

            if (!existingOrg) {
                // Organizzazione non trovata - skip e riporta errore
                errors.push({
                    experience: exp,
                    error: `Organization not found: ${orgName} (${orgCountry}, ${orgSport})`
                })
                console.warn(`Organization not found in database: ${orgName} (${orgCountry}, ${orgSport})`)
                continue
            }

            const organizationId = existingOrg.id

            // 2. Determina il ruolo generico (Player, Coach, Staff, Other)
            // Il form può mandare posizioni specifiche (es: "Difensore") che vanno in role_detail
            let genericRole = 'Player' // default
            const roleValue = exp.role || ''

            // Lista ruoli validi per il DB
            const validRoles = ['Player', 'Coach', 'Staff', 'Other']

            // Se il ruolo dal form è già valido, usalo
            if (validRoles.includes(roleValue)) {
                genericRole = roleValue
            } else {
                // Altrimenti, cerca di inferire dal valore
                const lowerRole = roleValue.toLowerCase()
                if (lowerRole.includes('coach') || lowerRole.includes('allenatore') || lowerRole.includes('mister')) {
                    genericRole = 'Coach'
                } else if (lowerRole.includes('staff') || lowerRole.includes('preparatore') || lowerRole.includes('fisioterapista')) {
                    genericRole = 'Staff'
                } else {
                    // Se è una posizione (Portiere, Difensore, etc.) → Player
                    genericRole = 'Player'
                }
            }

            // 3. Prepara i dati dell'esperienza mappando i campi del form ai campi DB
            const expData: any = {
                user_id: userId,
                organization_id: organizationId,
                role: genericRole,
                role_detail: validRoles.includes(roleValue) ? (exp.positionDetail || exp.primaryPosition || null) : roleValue,
                season: exp.season,
                category: exp.category || 'Non specificato',
                competition_type: exp.competitionType || 'male',
                start_date: exp.from || null,
                end_date: exp.to || null,
                is_current: exp.isCurrentlyPlaying || false,
            }

            // Aggiungi statistiche giocatore se role = Player (solo se fornite)
            if (exp.role === 'Player') {
                // Calcio - Base
                expData.goals = exp.goals !== undefined && exp.goals !== null ? exp.goals : null
                expData.assists = exp.assists !== undefined && exp.assists !== null ? exp.assists : null
                expData.clean_sheets = exp.cleanSheets !== undefined && exp.cleanSheets !== null ? exp.cleanSheets : null
                expData.appearances = exp.appearances !== undefined && exp.appearances !== null ? exp.appearances : null

                // Calcio - Avanzate
                expData.minutes_played = exp.minutesPlayed !== undefined && exp.minutesPlayed !== null ? exp.minutesPlayed : null
                expData.penalties = exp.penalties !== undefined && exp.penalties !== null ? exp.penalties : null
                expData.yellow_cards = exp.yellowCards !== undefined && exp.yellowCards !== null ? exp.yellowCards : null
                expData.red_cards = exp.redCards !== undefined && exp.redCards !== null ? exp.redCards : null
                expData.substitutions_in = exp.substitutionsIn !== undefined && exp.substitutionsIn !== null ? exp.substitutionsIn : null
                expData.substitutions_out = exp.substitutionsOut !== undefined && exp.substitutionsOut !== null ? exp.substitutionsOut : null

                // Basket
                expData.points_per_game = exp.pointsPerGame !== undefined && exp.pointsPerGame !== null ? exp.pointsPerGame : null
                expData.rebounds = exp.rebounds !== undefined && exp.rebounds !== null ? exp.rebounds : null

                // Volley
                expData.aces = exp.volleyAces !== undefined && exp.volleyAces !== null ? exp.volleyAces : null
                expData.blocks = exp.volleyBlocks !== undefined && exp.volleyBlocks !== null ? exp.volleyBlocks : null
                expData.digs = exp.volleyDigs !== undefined && exp.volleyDigs !== null ? exp.volleyDigs : null
            }

            // Aggiungi statistiche coach se role = Coach (solo se fornite)
            if (exp.role === 'Coach') {
                expData.matches_coached = exp.matchesCoached !== undefined && exp.matchesCoached !== null ? exp.matchesCoached : null
                expData.wins = exp.wins !== undefined && exp.wins !== null ? exp.wins : null
                expData.draws = exp.draws !== undefined && exp.draws !== null ? exp.draws : null
                expData.losses = exp.losses !== undefined && exp.losses !== null ? exp.losses : null
                expData.trophies = exp.trophies !== undefined && exp.trophies !== null ? exp.trophies : null
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
                    errors.push({
                        experience: { season: exp.season, team: orgName, category: exp.category },
                        error: `Errore database: ${error.message}`
                    })
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
                    errors.push({
                        experience: { season: exp.season, team: orgName, category: exp.category },
                        error: `Errore database: ${error.message}`
                    })
                    continue
                }

                savedExperiences.push(data)
            }
        }

        // Se ci sono errori e nessuna esperienza salvata, considera fallimento
        const hasErrors = errors.length > 0
        const allFailed = savedExperiences.length === 0 && experiences.length > 0

        if (allFailed && hasErrors) {
            return withCors(
                NextResponse.json({
                    success: false,
                    error: 'Nessuna esperienza salvata. Verifica che le organizzazioni esistano nel database.',
                    count: 0,
                    experiences: [],
                    errors: errors
                }, { status: 400 })
            )
        }

        return withCors(
            NextResponse.json({
                success: true,
                count: savedExperiences.length,
                experiences: savedExperiences,
                errors: hasErrors ? errors : undefined,
                message: hasErrors
                    ? `${savedExperiences.length} esperienze salvate, ${errors.length} ignorate (organizzazioni non trovate)`
                    : undefined
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
