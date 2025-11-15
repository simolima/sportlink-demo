import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const COMMENTS_PATH = path.join(process.cwd(), 'data', 'comments.json')

function ensureFile() {
    if (!fs.existsSync(COMMENTS_PATH)) {
        fs.mkdirSync(path.dirname(COMMENTS_PATH), { recursive: true })
        fs.writeFileSync(COMMENTS_PATH, '[]')
    }
}

function readComments() {
    ensureFile()
    const raw = fs.readFileSync(COMMENTS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeComments(comments: any[]) {
    ensureFile()
    fs.writeFileSync(COMMENTS_PATH, JSON.stringify(comments, null, 2))
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')
    const comments = readComments()

    if (postId) {
        const filtered = comments.filter((c: any) => String(c.postId) === String(postId))
        filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return NextResponse.json(filtered)
    }

    return NextResponse.json(comments)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { postId, authorId, authorName, content } = body || {}

        if (!postId || !authorId || !content?.trim()) {
            return NextResponse.json({ error: 'postId, authorId and content required' }, { status: 400 })
        }

        const comments = readComments()
        const newComment = {
            id: Date.now(),
            postId: String(postId),
            authorId: String(authorId),
            authorName: authorName || 'Utente',
            content: content.trim(),
            createdAt: new Date().toISOString()
        }

        comments.push(newComment)
        writeComments(comments)

        return NextResponse.json(newComment, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'invalid request' }, { status: 400 })
    }
}
