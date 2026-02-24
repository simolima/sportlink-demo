/**
 * API Route: /api/search/professionals
 * Migrated from JSON to Supabase — 15/02/2026
 * Updated: 24/02/2026 — All filters now properly implemented
 *
 * Searches profiles by role_id, sport, position, stats, licenses, etc.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const searchTerm = searchParams.get('searchTerm')?.toLowerCase() || ''
        const roleType = searchParams.get('roleType') || 'all'
        const sport = searchParams.get('sport') || ''
        const position = searchParams.get('position') || ''
        const city = searchParams.get('city')?.toLowerCase() || ''
        const country = searchParams.get('country')?.toLowerCase() || ''
        const availability = searchParams.get('availability') || ''
        const categoryParam = searchParams.get('category') || ''
        const detailedCategory = searchParams.get('detailedCategory') || ''
        const verified = searchParams.get('verified')
        const season = searchParams.get('season') || ''
        const minGoals = searchParams.get('minGoals')
        const minCleanSheets = searchParams.get('minCleanSheets')
        const minPoints = searchParams.get('minPoints')
        const minAssists = searchParams.get('minAssists')
        const minRebounds = searchParams.get('minRebounds')
        const minAces = searchParams.get('minAces')
        const minBlocks = searchParams.get('minBlocks')
        const minDigs = searchParams.get('minDigs')
        const uefaLicense = searchParams.get('uefaLicense') || ''
        const specialization = searchParams.get('specialization') || ''
        const hasUEFALicense = searchParams.get('hasUEFALicense') || ''
        const hasFIFALicense = searchParams.get('hasFIFALicense') || ''
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

        // Mappa role_id → professionalRole label (come si aspetta il frontend)
        const roleIdToLabel: Record<string, string> = {
            'player': 'Player',
            'coach': 'Coach',
            'agent': 'Agent',
            'sporting_director': 'Sporting Director',
            'athletic_trainer': 'Athletic Trainer',
            'nutritionist': 'Nutritionist',
            'physio': 'Physio/Masseur',
            'talent_scout': 'Talent Scout',
        }

        // =============================================
        // STEP 1: Resolve sport name → sport_id (if filtering by sport)
        // =============================================
        let sportId: number | null = null
        if (sport) {
            const { data: sportRow } = await supabaseServer
                .from('lookup_sports')
                .select('id')
                .ilike('name', sport)
                .maybeSingle()
            sportId = sportRow?.id || null
        }

        // =============================================
        // STEP 2: Collect user_ids that match sport/position/career filters
        //   (pre-filter via profile_sports and career_experiences)
        // =============================================
        let filteredUserIds: string[] | null = null // null = no sport/career filter applied

        // --- Filter by sport & position via profile_sports ---
        if (sportId || position) {
            let psQuery = supabaseServer
                .from('profile_sports')
                .select('user_id')
                .is('deleted_at', null)

            if (sportId) {
                psQuery = psQuery.eq('sport_id', sportId)
            }
            if (position) {
                // Resolve position name to id
                const posQuery = supabaseServer
                    .from('lookup_positions')
                    .select('id')
                    .ilike('name', position)
                if (sportId) {
                    posQuery.eq('sport_id', sportId)
                }
                const { data: posRows } = await posQuery
                const posIds = (posRows || []).map((p: any) => p.id)
                if (posIds.length > 0) {
                    psQuery = psQuery.in('primary_position_id', posIds)
                } else {
                    // Position not found — return empty results
                    return withCors(NextResponse.json({ data: [], total: 0, limit, offset, hasMore: false }))
                }
            }

            const { data: psRows } = await psQuery
            filteredUserIds = (psRows || []).map((r: any) => r.user_id)
            if (filteredUserIds.length === 0) {
                return withCors(NextResponse.json({ data: [], total: 0, limit, offset, hasMore: false }))
            }
        }

        // --- Filter by career stats (season, category, goals, etc.) via career_experiences ---
        const hasCareerFilter = season || categoryParam || detailedCategory ||
            minGoals || minCleanSheets || minPoints || minAssists || minRebounds ||
            minAces || minBlocks || minDigs

        if (hasCareerFilter) {
            let ceQuery = supabaseServer
                .from('career_experiences')
                .select('user_id')

            if (season) ceQuery = ceQuery.eq('season', season)
            if (detailedCategory) {
                ceQuery = ceQuery.ilike('category', detailedCategory)
            } else if (categoryParam) {
                // Macro-category: match any detailed category that belongs to it
                // e.g. "Professionisti" → "Serie A", "Serie B", etc. — use ilike pattern
                ceQuery = ceQuery.ilike('category', `%${categoryParam}%`)
            }
            if (minGoals) ceQuery = ceQuery.gte('goals', parseInt(minGoals))
            if (minCleanSheets) ceQuery = ceQuery.gte('clean_sheets', parseInt(minCleanSheets))
            if (minPoints) ceQuery = ceQuery.gte('points_per_game', parseFloat(minPoints))
            if (minAssists) ceQuery = ceQuery.gte('assists', parseInt(minAssists))
            if (minRebounds) ceQuery = ceQuery.gte('rebounds', parseInt(minRebounds))
            if (minAces) ceQuery = ceQuery.gte('aces', parseInt(minAces))
            if (minBlocks) ceQuery = ceQuery.gte('blocks', parseInt(minBlocks))
            if (minDigs) ceQuery = ceQuery.gte('digs', parseInt(minDigs))

            // If sport filter also active, narrow to those user_ids
            if (filteredUserIds) {
                ceQuery = ceQuery.in('user_id', filteredUserIds)
            }

            const { data: ceRows } = await ceQuery
            filteredUserIds = [...new Set((ceRows || []).map((r: any) => r.user_id))]
            if (filteredUserIds.length === 0) {
                return withCors(NextResponse.json({ data: [], total: 0, limit, offset, hasMore: false }))
            }
        }

        // =============================================
        // STEP 3: Main profiles query
        // =============================================
        let query = supabaseServer
            .from('profiles')
            .select('*, profile_sports(sport_id, is_main_sport, lookup_sports(name), primary_position:lookup_positions(name, category))', { count: 'exact' })
            .is('deleted_at', null)
            .not('role_id', 'is', null)

        // Pre-filtered user_ids (from sport/position/career)
        if (filteredUserIds !== null) {
            query = query.in('id', filteredUserIds)
        }

        // Filter by role type
        if (roleType !== 'all') {
            // Frontend sends either lowercase DB values (player, coach, agent)
            // or PascalCase labels (Player, Coach, Agent). Support both.
            const roleMap: Record<string, string> = {
                'Player': 'player',
                'Coach': 'coach',
                'Agent': 'agent',
                'Sporting Director': 'sporting_director',
                'Athletic Trainer': 'athletic_trainer',
                'Nutritionist': 'nutritionist',
                'Physio/Masseur': 'physio',
                'Talent Scout': 'talent_scout',
            }
            const dbRole = roleMap[roleType] || roleType.toLowerCase()
            query = query.eq('role_id', dbRole)
        }

        // Text search
        if (searchTerm) {
            query = query.or(
                `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`
            )
        }

        if (city) {
            query = query.ilike('city', `%${city}%`)
        }
        if (country) {
            query = query.ilike('country', `%${country}%`)
        }
        if (verified === 'true') {
            query = query.eq('is_verified', true)
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Search professionals error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        const total = count || 0

        // Normalizza: aggiunge professionalRole, sports e campi camelCase per il frontend
        const normalized = (data || []).map((profile: any) => {
            const sports = (profile.profile_sports || [])
                .map((ps: any) => ps.lookup_sports?.name)
                .filter(Boolean)

            const mainSportEntry = (profile.profile_sports || []).find((ps: any) => ps.is_main_sport)
            const primaryPosition = mainSportEntry?.primary_position?.name || null
            const positionCategory = mainSportEntry?.primary_position?.category || null

            // Rimuovi profile_sports dal payload (frontend non lo usa direttamente)
            const { profile_sports, ...rest } = profile

            return {
                ...rest,
                // camelCase aliases per il frontend
                firstName: profile.first_name,
                lastName: profile.last_name,
                avatarUrl: profile.avatar_url,
                coverUrl: profile.cover_url,
                professionalRole: roleIdToLabel[profile.role_id] || profile.role_id,
                sports,
                sport: sports[0] || null,
                primaryPosition,
                positionCategory,
                verified: profile.is_verified || false,
            }
        })

        return withCors(NextResponse.json({
            data: normalized,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        }))
    } catch (err) {
        console.error('Search professionals exception:', err)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}
