import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const POSTS_PATH = path.join(process.cwd(), 'data', 'posts.json')

function ensureFile() {
    if (!fs.existsSync(POSTS_PATH)) {
        fs.mkdirSync(path.dirname(POSTS_PATH), { recursive: true })
        fs.writeFileSync(POSTS_PATH, '[]')
    }
}

function readPosts() {
    ensureFile()
    const raw = fs.readFileSync(POSTS_PATH, 'utf8')
    try {
        return JSON.parse(raw || '[]')
    } catch (e) {
        return []
    }
}

function readUsers() {
    const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
    if (!fs.existsSync(USERS_PATH)) return []
    try {
        const raw = fs.readFileSync(USERS_PATH, 'utf8')
        return JSON.parse(raw || '[]')
    } catch (e) {
        return []
    }
}

function writePosts(posts: any[]) {
    ensureFile()
    fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2))
}

export async function GET() {
    const posts = readPosts()
    const users = readUsers()

    // Enrich posts with author avatar and normalize userId field
    const enrichedPosts = posts.map((post: any) => {
        const author = users.find((u: any) => String(u.id) === String(post.authorId))
        return {
            ...post,
            userId: post.authorId,
            authorAvatar: author?.avatarUrl || null
        }
    })

    return NextResponse.json(enrichedPosts)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const posts = readPosts()
        const newPost = {
            id: Date.now(),
            content: body.content ?? '',
            imageUrl: body.imageUrl ?? null,
            authorName: body.authorName ?? 'Anon',
            authorId: body.authorId ?? null,
            createdAt: new Date().toISOString(),
        }
        posts.unshift(newPost)
        writePosts(posts)
        return NextResponse.json(newPost)
    } catch (err) {
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}
