export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'
import { supabaseServer } from '@/lib/supabase-server'

// ─── Helper: map frontend role string → profile_type_enum value ───
function resolveProfileType(role: string | undefined): string {
    if (!role) return 'player'
    const lower = role.toLowerCase()
    if (lower === 'player' || lower.includes('giocatore')) return 'player'
    if (lower === 'coach' || lower.includes('allenatore') || lower.includes('mister')) return 'coach'
    if (lower === 'agent' || lower.includes('agente') || lower.includes('procuratore')) return 'agent'
    if (lower.includes('direttore') || lower.includes('director') || lower === 'ds') return 'sporting_director'
    if (lower.includes('preparatore') || lower.includes('athletic')) return 'athletic_trainer'
    if (lower.includes('nutrizionista') || lower.includes('nutritionist')) return 'nutritionist'
    if (lower.includes('fisioterapista') || lower.includes('physio')) return 'physio'
    return 'player'
}

// ─── Helper: determine which stats table to use based on sport + profile_type ───
function getStatsTable(sportName: string | null, profileType: string): string | null {
    if (profileType === 'coach') return 'experience_stats_coach'
    if (profileType !== 'player') return null // only player and coach have stats

    const sport = (sportName || '').toLowerCase()
    if (sport.includes('basket') || sport.includes('pallacanestro')) {
        return 'experience_stats_basketball_player'
    }
    if (sport.includes('volley') || sport.includes('pallavolo')) {
        return 'experience_stats_volleyball_player'
    }
    // Default: football (calcio, soccer, or unspecified)
    return 'experience_stats_football_player'
}

// ─── Country name normalization (Italian → English) ───
const COUNTRY_MAP: Record<string, string> = {
    'italia': 'Italy', 'spagna': 'Spain', 'francia': 'France',
    'germania': 'Germany', 'inghilterra': 'England', 'portogallo': 'Portugal',
    'olanda': 'Netherlands', 'belgio': 'Belgium', 'svizzera': 'Switzerland',
    'austria': 'Austria', 'grecia': 'Greece', 'turchia': 'Turkey',
    'stati uniti': 'United States', 'brasile': 'Brazil', 'argentina': 'Argentina',
}

// ═══════════════════════════════════════════════════════════════
// GET /api/career-experiences?userId=xxx
// Returns experiences with stats flattened (backward-compatible)
// ═══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return withCors(NextResponse.json({ error: 'userId is required' }, { status: 400 }))
        }

        // Fetch base experiences with organization + all stats tables via left joins
        const { data: experiences, error } = await supabaseServer
            .from('profile_experiences')
            .select(`
                *,
                organization:sports_organizations!organization_id(
                    id, name, country, city, sport_id,
                    lookup_sports(name)
                ),
                football_stats:experience_stats_football_player(
                    position_id, appearances, minutes_played, goals, assists,
                    clean_sheets, penalties_scored, yellow_cards, red_cards,
                    substitutions_in, substitutions_out,
                    position:lookup_positions(id, name, category)
                ),
                basketball_stats:experience_stats_basketball_player(
                    games_played, minutes_played, points_per_game, rebounds
                ),
                volleyball_stats:experience_stats_volleyball_player(
                    matches_played, aces, blocks, digs
                ),
                coach_stats:experience_stats_coach(
                    matches_coached, wins, draws, losses, trophies
                )
            `)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('start_date', { ascending: false })

        if (error) {
            console.error('Error fetching experiences:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Flatten stats into top-level fields for backward compatibility with frontend
        const normalized = (experiences || []).map((exp: any) => {
            const fb = exp.football_stats // single object or null (1:1 via PK)
            const bb = exp.basketball_stats
            const vb = exp.volleyball_stats
            const co = exp.coach_stats

            return {
                id: exp.id,
                user_id: exp.user_id,
                organization_id: exp.organization_id,
                profile_type: exp.profile_type,
                experience_kind: exp.experience_kind,
                title: exp.title,
                // Legacy compat: "role" field for frontend mapping
                role: exp.profile_type === 'player' ? 'Player'
                    : exp.profile_type === 'coach' ? 'Coach'
                        : exp.profile_type === 'agent' ? 'Agent'
                            : 'Other',
                role_detail: exp.role_detail || exp.title,
                season: exp.season,
                category: exp.category,
                category_tier: exp.category_tier,
                competition_type: exp.competition_type,
                start_date: exp.start_date,
                end_date: exp.end_date,
                is_current: exp.is_current,
                employment_type: exp.employment_type,
                description: exp.description,
                is_public: exp.is_public,
                created_at: exp.created_at,
                updated_at: exp.updated_at,
                // Organization (enriched with sport name)
                organization: exp.organization ? {
                    ...exp.organization,
                    sport: exp.organization.lookup_sports?.name ?? null,
                } : null,
                // Position (from football stats join)
                position: fb?.position ?? null,
                // ── Flattened football stats ──
                appearances: fb?.appearances ?? null,
                minutes_played: fb?.minutes_played ?? null,
                goals: fb?.goals ?? null,
                assists: fb?.assists ?? null,
                clean_sheets: fb?.clean_sheets ?? null,
                penalties: fb?.penalties_scored ?? null,
                yellow_cards: fb?.yellow_cards ?? null,
                red_cards: fb?.red_cards ?? null,
                substitutions_in: fb?.substitutions_in ?? null,
                substitutions_out: fb?.substitutions_out ?? null,
                // ── Flattened basketball stats ──
                points_per_game: bb?.points_per_game ?? null,
                rebounds: bb?.rebounds ?? null,
                // ── Flattened volleyball stats ──
                aces: vb?.aces ?? null,
                blocks: vb?.blocks ?? null,
                digs: vb?.digs ?? null,
                // ── Flattened coach stats ──
                matches_coached: co?.matches_coached ?? null,
                wins: co?.wins ?? null,
                draws: co?.draws ?? null,
                losses: co?.losses ?? null,
                trophies: co?.trophies ?? null,
            }
        })

        return withCors(NextResponse.json(normalized))
    } catch (err: any) {
        console.error('Unexpected error in GET /api/career-experiences:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/career-experiences
// Create or update experiences (upsert) + stats in child tables
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, experiences } = body

        if (!userId || !Array.isArray(experiences)) {
            return withCors(
                NextResponse.json({ error: 'userId and experiences array are required' }, { status: 400 })
            )
        }

        const savedExperiences = []
        const errors = []

        for (const exp of experiences) {
            // ── 0. Validate required fields ──
            const orgName = exp.team?.trim()
            const orgCountryRaw = exp.country?.trim() || 'Italia'
            const orgCountry = COUNTRY_MAP[orgCountryRaw.toLowerCase()] ?? orgCountryRaw
            const orgSport = exp.sport?.trim() || 'Calcio'
            const season = exp.season?.trim()

            if (!orgName) {
                errors.push({
                    experience: { season: season || '?', team: 'N/A', category: exp.category },
                    error: 'Campo "Organizzazione/Club" obbligatorio'
                })
                continue
            }

            if (!season) {
                errors.push({
                    experience: { season: 'N/A', team: orgName, category: exp.category },
                    error: 'Campo "Stagione" obbligatorio (es: 2024/2025)'
                })
                continue
            }

            // ── 1. Resolve organization ──
            let sportIdFilter: number | null = null
            if (orgSport) {
                const { data: sportRow } = await supabaseServer
                    .from('lookup_sports')
                    .select('id')
                    .ilike('name', orgSport)
                    .maybeSingle()
                sportIdFilter = sportRow?.id ?? null
            }

            let orgQuery = supabaseServer
                .from('sports_organizations')
                .select('id')
                .ilike('name', orgName)
                .eq('country', orgCountry)
            if (sportIdFilter) orgQuery = orgQuery.eq('sport_id', sportIdFilter)

            let { data: existingOrg } = await orgQuery.maybeSingle()

            // Fallback: search without country filter
            if (!existingOrg) {
                let fallbackQuery = supabaseServer
                    .from('sports_organizations')
                    .select('id')
                    .ilike('name', orgName)
                if (sportIdFilter) fallbackQuery = fallbackQuery.eq('sport_id', sportIdFilter)
                const { data: fallbackOrg } = await fallbackQuery.maybeSingle()
                existingOrg = fallbackOrg
            }

            if (!existingOrg) {
                errors.push({
                    experience: exp,
                    error: `Organization not found: ${orgName} (${orgCountry}, ${orgSport})`
                })
                continue
            }

            const organizationId = existingOrg.id

            // ── 2. Determine profile_type ──
            const profileType = resolveProfileType(exp.role)

            // ── 3. Build title from role/position ──
            const roleValue = exp.role || ''
            const positionDetail = exp.positionDetail || exp.primaryPosition || ''
            const title = positionDetail || roleValue || 'Esperienza'

            // ── 4. Resolve start_date (required by DB) ──
            let startDate = exp.from || null
            let endDate = exp.to || null

            if (!startDate && season) {
                const yearMatch = season.match(/^(\d{4})/)
                if (yearMatch) {
                    startDate = `${yearMatch[1]}-07-01`
                }
            }
            if (!startDate) {
                startDate = '2024-07-01' // ultimate fallback
            }

            // ── 5. Build profile_experiences row ──
            const expData: any = {
                user_id: userId,
                organization_id: organizationId,
                profile_type: profileType,
                experience_kind: 'club',
                title: title,
                role_detail: positionDetail || null,
                season: season,
                category: exp.category || null,
                category_tier: exp.categoryTier || null,
                competition_type: exp.competitionType || null,
                start_date: startDate,
                end_date: endDate || null,
                is_current: exp.isCurrentlyPlaying || false,
                employment_type: null,
                description: exp.description || null,
                is_public: true,
            }

            // ── 6. Upsert base experience ──
            let savedExp: any = null
            if (exp.id && typeof exp.id === 'string' && exp.id.length > 20) {
                // Update existing
                const { data, error } = await supabaseServer
                    .from('profile_experiences')
                    .update(expData)
                    .eq('id', exp.id)
                    .select()
                    .single()

                if (error) {
                    console.error('Error updating experience:', error)
                    errors.push({
                        experience: { season, team: orgName, category: exp.category },
                        error: `Errore database: ${error.message}`
                    })
                    continue
                }
                savedExp = data
            } else {
                // Insert new
                const { data, error } = await supabaseServer
                    .from('profile_experiences')
                    .insert(expData)
                    .select()
                    .single()

                if (error) {
                    console.error('Error inserting experience:', error)
                    errors.push({
                        experience: { season, team: orgName, category: exp.category },
                        error: `Errore database: ${error.message}`
                    })
                    continue
                }
                savedExp = data
            }

            // ── 7. Upsert stats in the correct child table ──
            const statsTable = getStatsTable(orgSport, profileType)

            if (statsTable && savedExp) {
                const statsData: any = { experience_id: savedExp.id }

                if (statsTable === 'experience_stats_football_player') {
                    // Resolve position_id
                    const posName = exp.positionDetail || null
                    if (posName) {
                        const { data: posData } = await supabaseServer
                            .from('lookup_positions')
                            .select('id')
                            .eq('name', posName)
                            .limit(1)
                            .maybeSingle()
                        if (posData) statsData.position_id = posData.id
                    }
                    statsData.goals = exp.goals ?? null
                    statsData.assists = exp.assists ?? null
                    statsData.clean_sheets = exp.cleanSheets ?? null
                    statsData.appearances = exp.appearances ?? null
                    statsData.minutes_played = exp.minutesPlayed ?? null
                    statsData.penalties_scored = exp.penalties ?? null
                    statsData.yellow_cards = exp.yellowCards ?? null
                    statsData.red_cards = exp.redCards ?? null
                    statsData.substitutions_in = exp.substitutionsIn ?? null
                    statsData.substitutions_out = exp.substitutionsOut ?? null
                } else if (statsTable === 'experience_stats_basketball_player') {
                    statsData.games_played = exp.appearances ?? null
                    statsData.minutes_played = exp.minutesPlayed ?? null
                    statsData.points_per_game = exp.pointsPerGame ?? null
                    statsData.rebounds = exp.rebounds ?? null
                } else if (statsTable === 'experience_stats_volleyball_player') {
                    statsData.matches_played = exp.appearances ?? null
                    statsData.aces = exp.volleyAces ?? null
                    statsData.blocks = exp.volleyBlocks ?? null
                    statsData.digs = exp.volleyDigs ?? null
                } else if (statsTable === 'experience_stats_coach') {
                    statsData.matches_coached = exp.matchesCoached ?? null
                    statsData.wins = exp.wins ?? null
                    statsData.draws = exp.draws ?? null
                    statsData.losses = exp.losses ?? null
                    statsData.trophies = exp.trophies ?? null
                }

                // Upsert stats (PK = experience_id)
                const { error: statsError } = await supabaseServer
                    .from(statsTable)
                    .upsert(statsData, { onConflict: 'experience_id' })

                if (statsError) {
                    console.error(`Error upserting stats in ${statsTable}:`, statsError)
                    // Non-blocking: experience saved, stats failed — log only
                }
            }

            savedExperiences.push(savedExp)
        }

        // ── 8. Auto-close previous experiences ──
        // If a newer experience exists, set end_date of the previous one
        // to the start_date of the next one (only if end_date is NULL and not is_current)
        if (savedExperiences.length > 0) {
            try {
                const { data: allExps } = await supabaseServer
                    .from('profile_experiences')
                    .select('id, start_date, end_date, is_current')
                    .eq('user_id', userId)
                    .is('deleted_at', null)
                    .order('start_date', { ascending: true })

                if (allExps && allExps.length > 1) {
                    for (let i = 0; i < allExps.length - 1; i++) {
                        const current = allExps[i]
                        const next = allExps[i + 1]

                        // Only auto-close if: no end_date AND not marked as current
                        if (!current.end_date && !current.is_current && next.start_date) {
                            await supabaseServer
                                .from('profile_experiences')
                                .update({ end_date: next.start_date })
                                .eq('id', current.id)
                        }
                    }
                }
            } catch (autoCloseErr) {
                console.error('Error in auto-close logic:', autoCloseErr)
                // Non-blocking: experiences already saved
            }
        }

        // ── Response ──
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
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/career-experiences?id=xxx
// Soft delete (sets deleted_at). Stats remain via FK for audit.
// ═══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return withCors(NextResponse.json({ error: 'id is required' }, { status: 400 }))
        }

        const { error } = await supabaseServer
            .from('profile_experiences')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            console.error('Error deleting experience:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        console.error('Unexpected error in DELETE /api/career-experiences:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// OPTIONS handler per CORS preflight
export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
