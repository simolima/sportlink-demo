/**
 * API Route: /api/search/professionals
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Searches profiles by role_id (player, coach, agent, etc.)
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
        const city = searchParams.get('city')?.toLowerCase() || ''
        const country = searchParams.get('country')?.toLowerCase() || ''
        const verified = searchParams.get('verified')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

        let query = supabaseServer
            .from('profiles')
            .select('*', { count: 'exact' })
            .is('deleted_at', null)
            .not('role_id', 'is', null)

        // Filter by role type
        if (roleType !== 'all') {
            // Map frontend role names to DB role_id values
            const roleMap: Record<string, string> = {
                'Player': 'player',
                'Coach': 'coach',
                'Agent': 'agent',
                'Sporting Director': 'sporting_director',
                'Athletic Trainer': 'athletic_trainer',
                'Nutritionist': 'nutritionist',
                'Physio/Masseur': 'physio',
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

        return withCors(NextResponse.json({
            data: data || [],
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
