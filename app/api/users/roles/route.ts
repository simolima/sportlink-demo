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
            return withCors(NextResponse.json(roleRows))
        }

        // Fallback: leggi da profiles.role_id
        const { data: profile } = await supabaseServer
            .from('profiles')
            .select('role_id')
            .eq('id', userId)
            .is('deleted_at', null)
            .single()

        if (profile?.role_id) {
            return withCors(NextResponse.json([
                { role_id: profile.role_id, is_primary: true },
            ]))
        }

        return withCors(NextResponse.json([]))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
