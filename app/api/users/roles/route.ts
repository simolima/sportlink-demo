export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))
        }

        // Prova dalla nuova tabella profile_roles
        const { data: roleRows, error } = await supabaseServer
            .from('profile_roles')
            .select('role_id, is_primary')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (!error && roleRows && roleRows.length > 0) {
            // Arricchisci ogni ruolo con lo sport associato (se presente)
            const { data: sportRows } = await supabaseServer
                .from('profile_sports')
                .select('role_id, is_main_sport, lookup_sports(name)')
                .eq('user_id', userId)
                .is('deleted_at', null)

            const sportsByRole: Record<string, string[]> = {}
            if (sportRows) {
                // Sort so is_main_sport comes first, then push all sport names per role
                const sorted = [...sportRows].sort((a, b) =>
                    (b.is_main_sport ? 1 : 0) - (a.is_main_sport ? 1 : 0)
                )
                for (const row of sorted) {
                    const sportName = (row as any).lookup_sports?.name
                    if (sportName && row.role_id) {
                        if (!sportsByRole[row.role_id]) sportsByRole[row.role_id] = []
                        if (!sportsByRole[row.role_id].includes(sportName)) {
                            sportsByRole[row.role_id].push(sportName)
                        }
                    }
                }
            }

            const enriched = roleRows.map(r => ({
                ...r,
                sport_names: sportsByRole[r.role_id] ?? [],
            }))

            return withCors(NextResponse.json(enriched))
        }

        // Fallback: leggi da profiles.role_id + sport dal vecchio profile_sports
        const { data: profile } = await supabaseServer
            .from('profiles')
            .select('role_id')
            .eq('id', userId)
            .is('deleted_at', null)
            .single()

        if (profile?.role_id) {
            // Cerca lo sport principale per il fallback
            const { data: mainSport } = await supabaseServer
                .from('profile_sports')
                .select('lookup_sports(name)')
                .eq('user_id', userId)
                .eq('is_main_sport', true)
                .is('deleted_at', null)
                .maybeSingle()

            const mainSportName = (mainSport as any)?.lookup_sports?.name
            return withCors(NextResponse.json([
                {
                    role_id: profile.role_id,
                    is_primary: true,
                    sport_names: mainSportName ? [mainSportName] : [],
                },
            ]))
        }

        return withCors(NextResponse.json([]))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
