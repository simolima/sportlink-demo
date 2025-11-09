import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'node'

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

export async function GET(req: Request) {
    const users = readUsers()
    return NextResponse.json(users)
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
            currentRole: body.currentRole ?? '',
            bio: body.bio ?? '',
            avatarUrl: body.avatarUrl ?? null,
            experiences: Array.isArray(body.experiences) ? body.experiences : [],
            createdAt: new Date().toISOString(),
        }
        users.unshift(newUser)
        writeUsers(users)
        return NextResponse.json(newUser)
    } catch (err) {
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}
