import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')

function ensureFile() {
    if (!fs.existsSync(FOLLOWS_PATH)) {
        fs.mkdirSync(path.dirname(FOLLOWS_PATH), { recursive: true })
        fs.writeFileSync(FOLLOWS_PATH, '[]')
    }
}

function readFollows() {
    ensureFile()
    const raw = fs.readFileSync(FOLLOWS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeFollows(items: any[]) {
    ensureFile()
    fs.writeFileSync(FOLLOWS_PATH, JSON.stringify(items, null, 2))
}

export async function GET() {
    const items = readFollows()
    return NextResponse.json(items)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const followerId = body.followerId
        const followeeId = body.followeeId
        if (!followerId || !followeeId) return NextResponse.json({ error: 'missing ids' }, { status: 400 })

        const items = readFollows()
        const exists = items.find((it: any) => it.followerId === followerId && it.followeeId === followeeId)
        if (exists) {
            // unfollow
            const updated = items.filter((it: any) => !(it.followerId === followerId && it.followeeId === followeeId))
            writeFollows(updated)
            return NextResponse.json({ action: 'unfollow' })
        } else {
            items.push({ id: Date.now(), followerId, followeeId, createdAt: new Date().toISOString() })
            writeFollows(items)
            return NextResponse.json({ action: 'follow' })
        }
    } catch (err) {
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}
