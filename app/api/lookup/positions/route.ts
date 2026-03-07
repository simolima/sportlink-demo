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
        const sportName = url.searchParams.get('sportName')
        const roleId = url.searchParams.get('roleId')

        if (!sportName || !roleId) {
            return withCors(NextResponse.json({ error: 'sportName and roleId required' }, { status: 400 }))
        }

        const lookupNames = sportName === 'Pallavolo'
            ? ['Pallavolo', 'Volley']
            : [sportName]

        const { data: sportRows, error: sportErr } = await supabaseServer
            .from('lookup_sports')
            .select('id, name')
            .in('name', lookupNames)

        if (sportErr) throw sportErr

        if (!sportRows || sportRows.length === 0) {
            return withCors(NextResponse.json([]))
        }

        const sportIds = sportRows.map(row => row.id)

        const { data: positions, error: positionsErr } = await supabaseServer
            .from('lookup_positions')
            .select('id, name, category')
            .in('sport_id', sportIds)
            .eq('role_id', roleId)
            .order('category')
            .order('name')

        if (positionsErr) throw positionsErr

        return withCors(NextResponse.json(positions || []))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
