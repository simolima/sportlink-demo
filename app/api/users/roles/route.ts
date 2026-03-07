export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { PROFESSIONAL_ROLES, type ProfessionalRole } from '@/lib/types'
import { getUserIdFromAuthToken, supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const queryUserId = url.searchParams.get('userId')
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        const userId = queryUserId || authenticatedUserId

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

export async function POST(req: Request) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const body = await req.json()
        const roleId = body?.roleId?.toString?.().toLowerCase() as ProfessionalRole | undefined
        const sports = Array.isArray(body?.sports)
            ? body.sports.map((sport: any) => sport?.toString?.()).filter(Boolean)
            : []
        const primaryPositionId = body?.primaryPositionId != null
            ? Number(body.primaryPositionId)
            : null

        if (!roleId || !(PROFESSIONAL_ROLES as readonly string[]).includes(roleId)) {
            return withCors(NextResponse.json({ error: 'invalid_role_id' }, { status: 400 }))
        }

        if (sports.length === 0) {
            return withCors(NextResponse.json({ error: 'sports_required' }, { status: 400 }))
        }

        const { data: existingRole } = await supabaseServer
            .from('profile_roles')
            .select('role_id')
            .eq('user_id', authenticatedUserId)
            .eq('role_id', roleId)
            .eq('is_active', true)
            .maybeSingle()

        if (existingRole) {
            return withCors(NextResponse.json({ error: 'role_already_exists' }, { status: 409 }))
        }

        const { error: roleErr } = await supabaseServer
            .from('profile_roles')
            .insert({
                user_id: authenticatedUserId,
                role_id: roleId,
                is_active: true,
                is_primary: false,
            })

        if (roleErr) throw roleErr

        const { data: sportsRows, error: sportsLookupErr } = await supabaseServer
            .from('lookup_sports')
            .select('id, name')

        if (sportsLookupErr) throw sportsLookupErr

        const sportNameToId: Record<string, number> = {}
        for (const row of sportsRows || []) {
            sportNameToId[row.name] = row.id
        }

        const sportRecords = sports
            .map((sportName: string, idx: number) => {
                const normalizedSportId =
                    sportNameToId[sportName] ??
                    sportNameToId[sportName === 'Pallavolo' ? 'Volley' : sportName]

                return {
                    user_id: authenticatedUserId,
                    sport_id: normalizedSportId,
                    role_id: roleId,
                    is_main_sport: idx === 0,
                    primary_position_id: idx === 0 ? primaryPositionId : null,
                }
            })
            .filter(record => record.sport_id != null)

        if (sportRecords.length === 0) {
            await supabaseServer
                .from('profile_roles')
                .delete()
                .eq('user_id', authenticatedUserId)
                .eq('role_id', roleId)

            return withCors(NextResponse.json({ error: 'invalid_sport_selection' }, { status: 400 }))
        }

        const { error: sportErr } = await supabaseServer
            .from('profile_sports')
            .insert(sportRecords)

        if (sportErr) {
            await supabaseServer
                .from('profile_roles')
                .delete()
                .eq('user_id', authenticatedUserId)
                .eq('role_id', roleId)

            throw sportErr
        }

        return withCors(
            NextResponse.json(
                { roleId, sports, primaryPositionId },
                { status: 201 }
            )
        )
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
