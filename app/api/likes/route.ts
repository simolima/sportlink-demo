import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const LIKES_PATH = path.join(process.cwd(), 'data', 'likes.json')

function ensureFile() {
    if (!fs.existsSync(LIKES_PATH)) {
        fs.mkdirSync(path.dirname(LIKES_PATH), { recursive: true })
        fs.writeFileSync(LIKES_PATH, '[]')
    }
}

function readLikes() {
    ensureFile()
    const raw = fs.readFileSync(LIKES_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeLikes(likes: any[]) {
    ensureFile()
    fs.writeFileSync(LIKES_PATH, JSON.stringify(likes, null, 2))
}

// GET /api/likes?postId=X oppure ?userId=Y
export async function GET(req: Request) {
    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')
    const userId = url.searchParams.get('userId')
    const likes = readLikes()

    if (postId) {
        const filtered = likes.filter((l: any) => String(l.postId) === String(postId))
        return NextResponse.json({ count: filtered.length, likes: filtered })
    }

    if (userId) {
        const filtered = likes.filter((l: any) => String(l.userId) === String(userId))
        return NextResponse.json({ count: filtered.length, likes: filtered })
    }

    return NextResponse.json(likes)
}

// POST /api/likes - toggle like (se esiste rimuove, altrimenti aggiunge)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { postId, userId } = body || {}

        if (!postId || !userId) {
            return NextResponse.json({ error: 'postId and userId required' }, { status: 400 })
        }

        const likes = readLikes()
        const existingIndex = likes.findIndex((l: any) =>
            String(l.postId) === String(postId) && String(l.userId) === String(userId)
        )

        if (existingIndex >= 0) {
            // Unlike - rimuovi
            likes.splice(existingIndex, 1)
            writeLikes(likes)
            return NextResponse.json({ action: 'unliked', count: likes.filter((l: any) => String(l.postId) === String(postId)).length })
        } else {
            // Like - aggiungi
            const newLike = {
                id: Date.now(),
                postId: String(postId),
                userId: String(userId),
                createdAt: new Date().toISOString()
            }
            likes.push(newLike)
            writeLikes(likes)
            return NextResponse.json({ action: 'liked', count: likes.filter((l: any) => String(l.postId) === String(postId)).length })
        }
    } catch (err) {
        return NextResponse.json({ error: 'invalid request' }, { status: 400 })
    }
}
