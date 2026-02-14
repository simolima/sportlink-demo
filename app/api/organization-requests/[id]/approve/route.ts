import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createClient(supabaseUrl, supabaseAnonKey)
}

// PATCH /api/organization-requests/[id]/approve
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabase()
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
        }
        const { id } = params
        const body = await request.json()
        const { reviewed_by } = body

        if (!reviewed_by) {
            return NextResponse.json({ error: 'Missing reviewed_by' }, { status: 400 })
        }

        // 1. Recupera la richiesta
        const { data: orgRequest, error: fetchError } = await supabase
            .from('organization_requests')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !orgRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // 2. Crea l'organizzazione
        const { data: newOrg, error: createError } = await supabase
            .from('sports_organizations')
            .insert({
                name: orgRequest.requested_name,
                country: orgRequest.requested_country,
                city: orgRequest.requested_city,
                sport: orgRequest.requested_sport
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating organization:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        // 3. Aggiorna la richiesta come approvata
        const { error: updateError } = await supabase
            .from('organization_requests')
            .update({
                status: 'approved',
                reviewed_by,
                reviewed_at: new Date().toISOString(),
                created_organization_id: newOrg.id
            })
            .eq('id', id)

        if (updateError) {
            console.error('Error updating request:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Request approved',
            organization: newOrg
        })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
