export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase } from '@/lib/supabase-server'

// OPTIONS /api/clubs - CORS preflight
export async function OPTIONS() {
    return handleOptions()
}

// Helper: risolve nomi sport → ID in lookup_sports (crea se non esiste)
async function resolveSportIds(sportNames: string[]): Promise<number[]> {
    if (!sportNames || sportNames.length === 0) return []

    const ids: number[] = []
    for (const name of sportNames) {
        // cerca esistente
        const { data: existing } = await supabase
            .from('lookup_sports')
            .select('id')
            .ilike('name', name)
            .single()

        if (existing) {
            ids.push(existing.id)
        } else {
            // crea nuovo sport
            const { data: created } = await supabase
                .from('lookup_sports')
                .insert({ name })
                .select('id')
                .single()
            if (created) ids.push(created.id)
        }
    }
    return ids
}

// Helper: inserisce righe in club_sports (ignora duplicati)
async function insertClubSports(clubId: string, sportIds: number[]) {
    if (sportIds.length === 0) return
    const rows = sportIds.map((sport_id) => ({ club_id: clubId, sport_id }))
    const { error } = await supabase.from('club_sports').upsert(rows, { onConflict: 'club_id,sport_id' })
    if (error) console.error('club_sports upsert error:', error)
}

// Helper: arricchisce i club con l'array dei nomi sport da club_sports
async function enrichWithSports(clubs: any[]): Promise<any[]> {
    if (!clubs || clubs.length === 0) return clubs

    const clubIds = clubs.map((c) => c.id)
    const { data: clubSports } = await supabase
        .from('club_sports')
        .select('club_id, lookup_sports(name)')
        .in('club_id', clubIds)

    // Raggruppa per club_id
    const sportsByClub: Record<string, string[]> = {}
    for (const row of clubSports || []) {
        const name = (row.lookup_sports as any)?.name
        if (!name) continue
        if (!sportsByClub[row.club_id]) sportsByClub[row.club_id] = []
        sportsByClub[row.club_id].push(name)
    }

    return clubs.map((c) => ({
        ...c,
        sports: sportsByClub[c.id] || [],
    }))
}

// GET /api/clubs - Get all clubs or filter by sport/city/search
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sport = searchParams.get('sport')
        const city = searchParams.get('city')
        const search = searchParams.get('search')

        let query = supabase
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false })

        if (city) {
            query = query.ilike('city', `%${city}%`)
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        const { data: clubs, error } = await query
        if (error) {
            console.error('Supabase GET clubs error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        let result = await enrichWithSports(clubs || [])

        // Filtra per sport dopo aver ottenuto i nomi
        if (sport && sport !== 'all') {
            result = result.filter((c) =>
                c.sports.some((s: string) => s.toLowerCase() === sport.toLowerCase())
            )
        }

        return withCors(NextResponse.json(result))

    } catch (err: any) {
        console.error('GET /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/clubs - Create a new club (solo Direttori Sportivi)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, sports, city, address, addressLat, addressLng, logoUrl, coverUrl, website, foundedYear, createdBy, organizationId } = body

        if (!name || !city) {
            return withCors(NextResponse.json({ error: 'name and city are required' }, { status: 400 }))
        }

        const creatorId = createdBy ? createdBy.toString() : null

        // Verifica che il creatore sia un Direttore Sportivo
        if (creatorId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id')
                .eq('id', creatorId)
                .single()

            if (!profile || profile.role_id !== 'sporting_director') {
                return withCors(NextResponse.json(
                    { error: 'Solo i Direttori Sportivi possono creare società' },
                    { status: 403 }
                ))
            }
        } else {
            return withCors(NextResponse.json({ error: 'createdBy is required' }, { status: 400 }))
        }

        const sportNames: string[] = Array.isArray(sports) ? sports : (sports ? [sports] : [])

        // 1. Risolvi i sport IDs
        const sportIds = sportNames.length > 0 ? await resolveSportIds(sportNames) : []

        // 2. Determina organization_id
        //    - organizationId = uuid   → l'utente ha scelto di collegare un'org esistente (o ne ha creata una via frontend)
        //    - organizationId = null   → nessuna corrispondenza trovata: creiamo qui una nuova org e la linchiamo
        let resolvedOrgId: string | null = organizationId ?? null

        if (!resolvedOrgId) {
            // Nessuna corrispondenza mostrata all'utente → creiamo automaticamente la riga in sports_organizations
            const { data: newOrg, error: orgError } = await supabase
                .from('sports_organizations')
                .insert({
                    name,
                    country: 'IT',
                    city: city || null,
                    sport_id: null, // nullable (polisportive: sport_id opzionale)
                })
                .select('id')
                .single()

            if (!orgError && newOrg) {
                resolvedOrgId = newOrg.id
            } else {
                // Potrebbe già esistere per unique constraint (race condition) → recuperiamo
                const { data: existing } = await supabase
                    .from('sports_organizations')
                    .select('id')
                    .eq('name', name)
                    .eq('country', 'IT')
                    .maybeSingle()
                resolvedOrgId = existing?.id ?? null
                if (orgError) console.warn('sports_organizations auto-create warn:', orgError.message)
            }
        }

        // 3. Inserisci il club con il link all'organizzazione
        const newClub: any = {
            name,
            description: description || '',
            city,
            address: address || null,
            address_lat: addressLat ?? null,
            address_lng: addressLng ?? null,
            logo_url: logoUrl || null,
            cover_url: coverUrl || null,
            website: website || null,
            founded_year: foundedYear || null,
            followers_count: 0,
            members_count: 0,
            verified: false,
            created_by: creatorId,
            owner_id: creatorId,
        }

        if (resolvedOrgId) newClub.organization_id = resolvedOrgId

        const { data: createdClub, error: clubError } = await supabase
            .from('clubs')
            .insert([newClub])
            .select()
            .single()

        if (clubError) {
            console.error('Supabase INSERT club error:', clubError)
            return withCors(NextResponse.json({ error: clubError.message }, { status: 500 }))
        }

        // 4. Collega gli sport in club_sports
        if (sportIds.length > 0) {
            await insertClubSports(createdClub.id, sportIds)
        }

        // 5. Crea membership Admin per il creatore
        if (creatorId) {
            const { data: existingMembership } = await supabase
                .from('club_memberships')
                .select('id')
                .eq('club_id', createdClub.id)
                .eq('user_id', creatorId)
                .eq('is_active', true)
                .maybeSingle()

            if (!existingMembership) {
                const { error: membershipError } = await supabase
                    .from('club_memberships')
                    .insert([{
                        club_id: createdClub.id,
                        user_id: creatorId,
                        role: 'Admin',
                        permissions: ['create_opportunities', 'manage_applications', 'manage_members', 'edit_club_info'],
                        is_active: true,
                    }])
                if (membershipError) console.error('Membership creation error:', membershipError)
            }
        }

        // 6. Restituisce il club arricchito con gli sport
        const enriched = await enrichWithSports([createdClub])
        return withCors(NextResponse.json(enriched[0], { status: 201 }))

    } catch (err: any) {
        console.error('POST /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        if (!body.id) {
            return withCors(NextResponse.json({ error: 'ID required' }, { status: 400 }))
        }

        // Campi scalari del club
        const updates: any = { updated_at: new Date().toISOString() }
        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) updates.description = body.description
        if (body.city !== undefined) updates.city = body.city
        if (body.address !== undefined) updates.address = body.address
        if (body.addressLat !== undefined) updates.address_lat = body.addressLat
        if (body.addressLng !== undefined) updates.address_lng = body.addressLng
        if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl
        if (body.coverUrl !== undefined) updates.cover_url = body.coverUrl
        if (body.website !== undefined) updates.website = body.website
        if (body.foundedYear !== undefined) updates.founded_year = body.foundedYear
        if (body.verified !== undefined) updates.verified = body.verified

        const { data: updated, error } = await supabase
            .from('clubs')
            .update(updates)
            .eq('id', body.id)
            .select()
            .single()

        if (error) {
            console.error('Supabase UPDATE club error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Aggiorna gli sport se forniti (replace completo)
        if (body.sports !== undefined) {
            const sportNames: string[] = Array.isArray(body.sports) ? body.sports : [body.sports]
            // Rimuovi tutti gli sport esistenti
            await supabase.from('club_sports').delete().eq('club_id', body.id)
            // Reinserisci
            if (sportNames.length > 0) {
                const sportIds = await resolveSportIds(sportNames)
                await insertClubSports(body.id, sportIds)
            }
        }

        const enriched = await enrichWithSports([updated])
        return withCors(NextResponse.json(enriched[0]))

    } catch (err: any) {
        console.error('PUT /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/clubs - Delete a club
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return withCors(NextResponse.json({ error: 'ID required' }, { status: 400 }))
        }

        // club_sports si elimina in CASCADE con il club
        const { error } = await supabase.from('clubs').delete().eq('id', id)

        if (error) {
            console.error('Supabase DELETE club error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))

    } catch (err: any) {
        console.error('DELETE /api/clubs error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
