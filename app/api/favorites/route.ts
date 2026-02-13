export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors } from '@/lib/cors'
import { createNotification } from '@/lib/notifications-repository'
import { dispatchToUser } from '@/lib/notification-dispatcher'

const DATA_PATH = path.join(process.cwd(), 'data', 'favorites.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function ensureFile() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, JSON.stringify([]))
    }
}

function readData() {
    ensureFile()
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8') || '[]')
}

function writeData(data: any) {
    ensureFile()
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

function readUsers() {
    if (!fs.existsSync(USERS_PATH)) return []
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8') || '[]')
}

// GET: Ottieni tutti i preferiti (opzionalmente filtrati)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId') // Chi ha aggiunto ai preferiti
        const favoriteId = searchParams.get('favoriteId') // Chi è stato aggiunto ai preferiti

        const data = readData()

        let filtered = data

        if (userId) {
            filtered = filtered.filter((f: any) => String(f.userId) === String(userId))
        }

        if (favoriteId) {
            filtered = filtered.filter((f: any) => String(f.favoriteId) === String(favoriteId))
        }

        return withCors(NextResponse.json(filtered))
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

        const data = readData()
        const users = readUsers()

        // Controlla se il preferito esiste già
        const exists = data.find(
            (f: any) => String(f.userId) === String(userId) && String(f.favoriteId) === String(favoriteId)
        )

        if (exists) {
            return withCors(NextResponse.json({ error: 'Already in favorites' }, { status: 400 }))
        }

        const user = users.find((u: any) => String(u.id) === String(userId))
        if (!user) {
            return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }))
        }

        const favorite = users.find((u: any) => String(u.id) === String(favoriteId))
        if (!favorite) {
            return withCors(NextResponse.json({ error: 'Favorite user not found' }, { status: 404 }))
        }

        const favoriteEntry = {
            id: Date.now(),
            userId: Number(userId),
            favoriteId: Number(favoriteId),
            createdAt: new Date().toISOString()
        }

        data.push(favoriteEntry)
        writeData(data)

        // Crea notifica per l'utente aggiunto ai preferiti
        const notification = await createNotification({
            userId: Number(favoriteId),
            type: 'added_to_favorites',
            relatedUserId: Number(userId),
            message: `${user.firstName} ${user.lastName} ti ha aggiunto ai preferiti`,
            read: false
        })

        // Invia notifica in real-time
        if (notification) {
            dispatchToUser(Number(favoriteId), notification)
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

        const data = readData()
        const filtered = data.filter(
            (f: any) => !(String(f.userId) === String(userId) && String(f.favoriteId) === String(favoriteId))
        )

        if (filtered.length === data.length) {
            return withCors(NextResponse.json({ error: 'Favorite not found' }, { status: 404 }))
        }

        writeData(filtered)

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
