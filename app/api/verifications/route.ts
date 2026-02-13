export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'
import { supabaseServer } from '@/lib/supabase-server'
import { createNotification } from '@/lib/notifications-repository'
import { dispatchToUser } from '@/lib/notification-dispatcher'

// GET: Ottieni tutte le verifiche (opzionalmente filtrate per userId o verificatoreId)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const verifiedId = searchParams.get('verifiedId') // Chi è stato verificato
        const verifierId = searchParams.get('verifierId') // Chi ha verificato

        let query = supabaseServer.from('verifications').select('*')

        if (verifiedId) {
            query = query.eq('verified_id', verifiedId)
        }

        if (verifierId) {
            query = query.eq('verifier_id', verifierId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching verifications:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data || []))
    } catch (error) {
        console.error('Error fetching verifications:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// POST: Crea una verificazione
export async function POST(req: Request) {
    try {
        const { verifierId, verifiedId } = await req.json()

        if (!verifierId || !verifiedId) {
            return withCors(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
        }

        if (String(verifierId) === String(verifiedId)) {
            return withCors(NextResponse.json({ error: 'Cannot verify yourself' }, { status: 400 }))
        }

        // Controlla se la verificazione esiste già
        const { data: existing } = await supabaseServer
            .from('verifications')
            .select('id')
            .eq('verifier_id', verifierId)
            .eq('verified_id', verifiedId)
            .single()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Already verified' }, { status: 400 }))
        }

        // Verifica che gli utenti esistano
        const { data: verifier } = await supabaseServer
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', verifierId)
            .single()

        if (!verifier) {
            return withCors(NextResponse.json({ error: 'Verifier not found' }, { status: 404 }))
        }

        const { data: verified } = await supabaseServer
            .from('profiles')
            .select('id')
            .eq('id', verifiedId)
            .single()

        if (!verified) {
            return withCors(NextResponse.json({ error: 'Verified user not found' }, { status: 404 }))
        }

        // Crea la verificazione
        const { data: verification, error } = await supabaseServer
            .from('verifications')
            .insert({
                verifier_id: verifierId,
                verified_id: verifiedId
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating verification:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Crea notifica per l'utente verificato
        const notification = await createNotification({
            userId: verifiedId,
            type: 'profile_verified',
            title: 'Profilo Verificato',
            message: `${verifier.first_name} ${verifier.last_name} ha verificato il tuo profilo`,
            metadata: { verifierId: verifierId }
        })

        // Invia notifica in real-time
        if (notification) {
            dispatchToUser(verifiedId, notification)
        }

        return withCors(NextResponse.json(verification, { status: 201 }))
    } catch (error) {
        console.error('Error creating verification:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// DELETE: Rimuovi una verificazione
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const verifierId = searchParams.get('verifierId')
        const verifiedId = searchParams.get('verifiedId')

        if (!verifierId || !verifiedId) {
            return withCors(NextResponse.json({ error: 'Missing required parameters' }, { status: 400 }))
        }

        // Rimuovi la verificazione
        const { error } = await supabaseServer
            .from('verifications')
            .delete()
            .eq('verifier_id', verifierId)
            .eq('verified_id', verifiedId)

        if (error) {
            console.error('Error deleting verification:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (error) {
        console.error('Error deleting verification:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
