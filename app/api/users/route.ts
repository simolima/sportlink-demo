import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function ensureFile() {
    if (!fs.existsSync(USERS_PATH)) {
        fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true })
        fs.writeFileSync(USERS_PATH, '[]')
    }
}

function readUsers() {
    ensureFile()
    const raw = fs.readFileSync(USERS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeUsers(users: any[]) {
    ensureFile()
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2))
}

// Handle preflight requests
export async function OPTIONS(req: Request) {
    return handleOptions()
}

export async function GET(req: Request) {
    const users = readUsers()
    return withCors(NextResponse.json(users))
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        // basic validation: require email and uniqueness
        const email = (body.email || '').toString().trim().toLowerCase()
        if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 })

        const users = readUsers()
        const exists = users.find((u: any) => u.email && u.email.toString().toLowerCase() === email)
        if (exists) return NextResponse.json({ error: 'email_exists' }, { status: 409 })

        const newUser = {
            id: Date.now(),
            firstName: body.firstName ?? '',
            lastName: body.lastName ?? '',
            email,
            birthDate: body.birthDate ?? null,
            currentRole: body.currentRole ?? '',
            bio: body.bio ?? '',
            avatarUrl: body.avatarUrl ?? null,
            coverUrl: body.coverUrl ?? null,
            experiences: Array.isArray(body.experiences) ? body.experiences : [],
            createdAt: new Date().toISOString(),
        }
        users.unshift(newUser)
        writeUsers(users)
        return withCors(NextResponse.json(newUser))
    } catch (err) {
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const id = body.id ?? null
        if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

        const users = readUsers()
        const idx = users.findIndex((u: any) => String(u.id) === String(id))
        if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 })

        const current = users[idx]
        const updated = {
            ...current,
            firstName: body.firstName ?? current.firstName,
            lastName: body.lastName ?? current.lastName,
            email: body.email ?? current.email,
            birthDate: body.birthDate ?? current.birthDate,
            currentRole: body.currentRole ?? current.currentRole,
            bio: body.bio ?? current.bio,
            avatarUrl: body.avatarUrl ?? current.avatarUrl,
            coverUrl: body.coverUrl ?? current.coverUrl,
            username: body.username ?? current.username,
            experiences: Array.isArray(body.experiences) ? body.experiences : current.experiences,
            updatedAt: new Date().toISOString(),
        }
        users[idx] = updated
        writeUsers(users)
        return withCors(NextResponse.json(updated))
    } catch (err) {
        return withCors(NextResponse.json({ error: 'invalid body' }, { status: 400 }))
    }
}
