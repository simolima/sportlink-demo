/**
 * API Route: /api/match
 * Migrated — 15/02/2026
 *
 * Matches athletes from Supabase profiles against a need.
 * Note: needs table doesn't exist yet, so this uses inline need data.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const need = body // Use inline need data since needs table doesn't exist

        // Get players from Supabase
        const { data: profiles, error } = await supabaseServer
            .from('profiles')
            .select('id, first_name, last_name, birth_date, city, role_id')
            .eq('role_id', 'player')
            .is('deleted_at', null)
            .limit(100)

        if (error) {
            console.error('Match API error:', error)
            return withCors(NextResponse.json({ candidates: [] }))
        }

        const candidates = (profiles || [])
            .map((p: any) => {
                const age = getAge(p.birth_date)
                const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Athlete'
                let score = 0
                const why: string[] = []

                // Basic scoring
                if (need.ageMin && age && age >= need.ageMin) { score += 5; why.push('age ok') }
                if (need.ageMax && age && age <= need.ageMax) { score += 5; why.push('age ok') }
                if (need.city && p.city && p.city.toLowerCase().includes(need.city.toLowerCase())) {
                    score += 10; why.push('city match')
                }

                return { name: displayName, score, why }
            })
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 10)

        return withCors(NextResponse.json({ candidates }))
    } catch (err) {
        console.error('Match API exception:', err)
        return withCors(NextResponse.json({ candidates: [] }))
    }
}
