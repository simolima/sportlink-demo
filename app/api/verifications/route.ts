export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors } from '@/lib/cors'
import { createNotification } from '@/lib/notifications-repository'
import { dispatchToUser } from '@/lib/notification-dispatcher'

const DATA_PATH = path.join(process.cwd(), 'data', 'verifications.json')
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

// GET: Ottieni tutte le verifiche (opzionalmente filtrate per userId o verificatoreId)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const verifiedId = searchParams.get('verifiedId') // Chi è stato verificato
        const verifierId = searchParams.get('verifierId') // Chi ha verificato

        const data = readData()

        let filtered = data

        if (verifiedId) {
            filtered = filtered.filter((v: any) => String(v.verifiedId) === String(verifiedId))
        }

        if (verifierId) {
            filtered = filtered.filter((v: any) => String(v.verifierId) === String(verifierId))
        }

        return withCors(NextResponse.json(filtered))
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

        const data = readData()
        const users = readUsers()

        // Controlla se la verificazione esiste già
        const exists = data.find(
            (v: any) => String(v.verifierId) === String(verifierId) && String(v.verifiedId) === String(verifiedId)
        )

        if (exists) {
            return withCors(NextResponse.json({ error: 'Already verified' }, { status: 400 }))
        }

        const verifier = users.find((u: any) => String(u.id) === String(verifierId))
        if (!verifier) {
            return withCors(NextResponse.json({ error: 'Verifier not found' }, { status: 404 }))
        }

        const verified = users.find((u: any) => String(u.id) === String(verifiedId))
        if (!verified) {
            return withCors(NextResponse.json({ error: 'Verified user not found' }, { status: 404 }))
        }

        const verification = {
            id: Date.now(),
            verifierId: Number(verifierId),
            verifiedId: Number(verifiedId),
            createdAt: new Date().toISOString()
        }

        data.push(verification)
        writeData(data)

        // Crea notifica per l'utente verificato
        const notification = await createNotification({
            userId: Number(verifiedId),
            type: 'profile_verified',
            relatedUserId: Number(verifierId),
            message: `${verifier.firstName} ${verifier.lastName} ha verificato il tuo profilo`,
            read: false
        })

        // Invia notifica in real-time
        if (notification) {
            dispatchToUser(Number(verifiedId), notification)
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

        const data = readData()
        const filtered = data.filter(
            (v: any) => !(String(v.verifierId) === String(verifierId) && String(v.verifiedId) === String(verifiedId))
        )

        if (filtered.length === data.length) {
            return withCors(NextResponse.json({ error: 'Verification not found' }, { status: 404 }))
        }

        writeData(filtered)

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
