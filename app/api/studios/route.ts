export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

const MEDICAL_ROLES = ['athletic_trainer', 'nutritionist', 'physio']

async function userHasMedicalRole(userId: string): Promise<boolean> {
    const { data: activeMedicalRole } = await supabase
        .from('profile_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('role_id', MEDICAL_ROLES)
        .limit(1)
        .maybeSingle()

    if (activeMedicalRole?.role_id) return true

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .maybeSingle()

    return !!profile?.role_id && MEDICAL_ROLES.includes(String(profile.role_id).toLowerCase())
}

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios — lista pubblica degli studi con filtri opzionali
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const city = searchParams.get('city')
        const search = searchParams.get('search')
        const ownerId = searchParams.get('ownerId')

        let query = supabase
            .from('professional_studios')
            .select(`
                *,
                owner:profiles!owner_id(
                    id, first_name, last_name, avatar_url, role_id
                )
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (city) query = query.ilike('city', `%${city}%`)
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        if (ownerId) query = query.eq('owner_id', ownerId)

        const { data, error } = await query
        if (error) throw error

        const result = (data || []).map((s: any) => ({
            id: s.id,
            ownerId: s.owner_id,
            name: s.name,
            city: s.city,
            address: s.address,
            phone: s.phone,
            website: s.website,
            logoUrl: s.logo_url,
            description: s.description,
            servicesOffered: s.services_offered ?? [],
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            owner: s.owner ? {
                id: s.owner.id,
                firstName: s.owner.first_name,
                lastName: s.owner.last_name,
                avatarUrl: s.owner.avatar_url,
                roleId: s.owner.role_id,
            } : undefined,
        }))

        return withCors(NextResponse.json(result))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/studios — crea un nuovo studio (solo ruoli medici)
export async function POST(req: Request) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        // Verifica ruolo medico (multi-profile aware)
        const hasMedicalRole = await userHasMedicalRole(authenticatedUserId)
        if (!hasMedicalRole) {
            return withCors(NextResponse.json(
                { error: 'Solo Preparatori Atletici, Nutrizionisti e Fisioterapisti possono creare uno studio' },
                { status: 403 }
            ))
        }

        // Verifica che non esista già uno studio per questo owner
        const { data: existing } = await supabase
            .from('professional_studios')
            .select('id')
            .eq('owner_id', authenticatedUserId)
            .is('deleted_at', null)
            .maybeSingle()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Hai già uno studio registrato' }, { status: 409 }))
        }

        const body = await req.json()
        const { name, city, address, phone, website, logoUrl, description, servicesOffered } = body

        if (!name) {
            return withCors(NextResponse.json({ error: 'name is required' }, { status: 400 }))
        }

        const { data: studio, error } = await supabase
            .from('professional_studios')
            .insert({
                owner_id: authenticatedUserId,
                name,
                city: city || null,
                address: address || null,
                phone: phone || null,
                website: website || null,
                logo_url: logoUrl || null,
                description: description || null,
                services_offered: servicesOffered ?? [],
            })
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: studio.id,
            ownerId: studio.owner_id,
            name: studio.name,
            city: studio.city,
            address: studio.address,
            phone: studio.phone,
            website: studio.website,
            logoUrl: studio.logo_url,
            description: studio.description,
            servicesOffered: studio.services_offered ?? [],
            createdAt: studio.created_at,
            updatedAt: studio.updated_at,
        }, { status: 201 }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
