export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'
import { createNotification } from '@/lib/notifications-repository'
import { dispatchToUser } from '@/lib/notification-dispatcher'
import { supabaseServer } from '@/lib/supabase-server'

// GET: Ottieni tutti i preferiti (opzionalmente filtrati)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId') // Chi ha aggiunto ai preferiti
        const favoriteId = searchParams.get('favoriteId') // Chi è stato aggiunto ai preferiti

        let query = supabaseServer.from('favorites').select('*')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        if (favoriteId) {
            query = query.eq('favorite_id', favoriteId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching favorites:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(data))
    } catch (error) {
        console.error('Error fetching favorites:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// POST: Aggiungi ai preferiti
export async function POST(req: Request) {
    try {
        const { userId, favoriteId } = await req.json()

        if (!userId || !favoriteId) {
            return withCors(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
        }

        if (String(userId) === String(favoriteId)) {
            return withCors(NextResponse.json({ error: 'Cannot favorite yourself' }, { status: 400 }))
        }

        // Controlla se il preferito esiste già
        const { data: existing } = await supabaseServer
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('favorite_id', favoriteId)
            .single()

        if (existing) {
            return withCors(NextResponse.json({ error: 'Already in favorites' }, { status: 400 }))
        }

        // Verifica che gli utenti esistano
        const { data: user } = await supabaseServer
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', userId)
            .single()

        if (!user) {
            return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }))
        }

        const { data: favorite } = await supabaseServer
            .from('profiles')
            .select('id')
            .eq('id', favoriteId)
            .single()

        if (!favorite) {
            return withCors(NextResponse.json({ error: 'Favorite user not found' }, { status: 404 }))
        }

        // Crea il preferito
        const { data: favoriteEntry, error } = await supabaseServer
            .from('favorites')
            .insert({
                user_id: userId,
                favorite_id: favoriteId
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating favorite:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Crea notifica per l'utente aggiunto ai preferiti
        const notification = await createNotification({
            userId: favoriteId,
            type: 'added_to_favorites',
            title: 'Aggiunto ai Preferiti',
            message: `${user.first_name} ${user.last_name} ti ha aggiunto ai preferiti`,
            metadata: { userId: userId }
        })

        // Invia notifica in real-time
        if (notification) {
            dispatchToUser(favoriteId, notification)
        }

        return withCors(NextResponse.json(favoriteEntry, { status: 201 }))
    } catch (error) {
        console.error('Error creating favorite:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// DELETE: Rimuovi dai preferiti
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const favoriteId = searchParams.get('favoriteId')

        if (!userId || !favoriteId) {
            return withCors(NextResponse.json({ error: 'Missing required parameters' }, { status: 400 }))
        }

        // Rimuovi il preferito
        const { error } = await supabaseServer
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('favorite_id', favoriteId)

        if (error) {
            console.error('Error deleting favorite:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true }))
    } catch (error) {
        console.error('Error deleting favorite:', error)
        return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
    }
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
