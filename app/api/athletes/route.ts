/**
 * API Route: /api/athletes
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Reads from profiles table where role_id = 'player'
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

function getAge(birthDate?: string): number | null {
    if (!birthDate) return null
    const date = new Date(birthDate)
    if (Number.isNaN(date.getTime())) return null
    const now = new Date()
    let age = now.getFullYear() - date.getFullYear()
    const m = now.getMonth() - date.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--
    return age
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const sport = searchParams.get('sport') || undefined
        const ageMin = Number(searchParams.get('age_min') || 0)
        const ageMax = Number(searchParams.get('age_max') || 100)

        // Get players from profiles
        const { data: profiles, error } = await supabaseServer
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url, bio, city, country, birth_date, role_id')
            .eq('role_id', 'player')
            .is('deleted_at', null)

        if (error) {
            console.error('GET /api/athletes error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Get sports for each player
        const playerIds = (profiles || []).map((p: any) => p.id)
        let sportsMap: Record<string, string> = {}

        if (playerIds.length > 0) {
            const { data: sportData } = await supabaseServer
                .from('profile_sports')
                .select('user_id, sport_id, lookup_sports:sport_id(name)')
                .in('user_id', playerIds)
                .is('deleted_at', null)

            if (sportData) {
                for (const ps of sportData) {
                    const sportName = (ps as any).lookup_sports?.name || ''
                    if (sportName && !sportsMap[ps.user_id]) {
                        sportsMap[ps.user_id] = sportName
                    }
                }
            }
        }

        let items = (profiles || []).map((p: any) => ({
            id: p.id,
            sport: sportsMap[p.id] || '',
            position: '',
            age: getAge(p.birth_date),
            contract: 'FREE',
            profile: {
                displayName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Athlete',
                avatarUrl: p.avatar_url || null,
            },
        }))

        // Filter by sport
        if (sport) {
            items = items.filter((a: any) => a.sport === sport)
        }

        // Filter by age range
        items = items.filter((a: any) => {
            if (typeof a.age !== 'number') return true
            return a.age >= ageMin && a.age <= ageMax
        })

        return withCors(NextResponse.json({ items: items.slice(0, 60), total: items.length }))
    } catch (err) {
        console.error('GET /api/athletes exception:', err)
        return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }))
    }
}
