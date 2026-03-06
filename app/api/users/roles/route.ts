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

            const sportByRole: Record<string, string> = {}
            if (sportRows) {
                for (const row of sportRows) {
                    const sportName = (row as any).lookup_sports?.name
                    if (sportName && row.role_id) {
                        // Preferisci lo sport principale
                        if (!sportByRole[row.role_id] || row.is_main_sport) {
                            sportByRole[row.role_id] = sportName
                        }
                    }
                }
            }

            const enriched = roleRows.map(r => ({
                ...r,
                sport_name: sportByRole[r.role_id] ?? null,
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

            return withCors(NextResponse.json([
                {
                    role_id: profile.role_id,
                    is_primary: true,
                    sport_name: (mainSport as any)?.lookup_sports?.name ?? null,
                },
            ]))
        }

        return withCors(NextResponse.json([]))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
