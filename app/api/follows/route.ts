// Clean, single implementation of follow/unfollow API.
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const NOTIFICATIONS_PATH = path.join(process.cwd(), 'data', 'notifications.json')

function ensureFile(filePath: string, defaultContent: string = '[]') {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, defaultContent)
    }
}

function readFollows() {
    ensureFile(FOLLOWS_PATH)
    const raw = fs.readFileSync(FOLLOWS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeFollows(follows: any[]) {
    ensureFile(FOLLOWS_PATH)
    fs.writeFileSync(FOLLOWS_PATH, JSON.stringify(follows, null, 2))
}

function readUsers() {
    ensureFile(USERS_PATH)
    const raw = fs.readFileSync(USERS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function readNotifications() {
    ensureFile(NOTIFICATIONS_PATH)
    const raw = fs.readFileSync(NOTIFICATIONS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeNotifications(notifications: any[]) {
    ensureFile(NOTIFICATIONS_PATH)
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2))
}

// Helper per creare notifica "new_follower"
function createFollowNotification(followerUser: any, followedUserId: string) {
    const notifications = readNotifications()
    const followerName = `${followerUser.firstName || ''} ${followerUser.lastName || ''}`.trim() || 'Un utente'

    const newNotification = {
        id: Date.now(),
        userId: followedUserId,
        type: 'new_follower',
        title: 'Nuovo follower',
        message: `${followerName} ha iniziato a seguirti.`,
        metadata: {
            followerId: followerUser.id,
            followerName: followerName,
            followerAvatar: followerUser.avatarUrl || followerUser.avatar || null
        },
        read: false,
        createdAt: new Date().toISOString()
    }

    notifications.push(newNotification)
    writeNotifications(notifications)
    return newNotification
}

export async function OPTIONS(req: Request) {
    return handleOptions()
}

// GET /api/follows?followerId=XXX | followingId=YYY
export async function GET(req: Request) {
    const url = new URL(req.url)
    const followerId = url.searchParams.get('followerId')
    const followingId = url.searchParams.get('followingId')
    const follows = readFollows()

    if (followerId) {
        return withCors(NextResponse.json(follows.filter((f: any) => String(f.followerId) === String(followerId))))
    }
    if (followingId) {
        return withCors(NextResponse.json(follows.filter((f: any) => String(f.followingId) === String(followingId))))
    }
    return withCors(NextResponse.json(follows))
}

// POST body: { followerId, followingId } -> create follow (no toggle here; use DELETE to unfollow)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const followerId = body.followerId?.toString().trim()
        const followingId = body.followingId?.toString().trim()
        if (!followerId || !followingId) {
            return withCors(NextResponse.json({ error: 'followerId_and_followingId_required' }, { status: 400 }))
        }
        if (followerId === followingId) {
            return withCors(NextResponse.json({ error: 'cannot_follow_self' }, { status: 400 }))
        }

        const follows = readFollows()
        const exists = follows.find((f: any) => f.followerId === followerId && f.followingId === followingId)
        if (exists) {
            return withCors(NextResponse.json({ error: 'already_following' }, { status: 409 }))
        }
        const newFollow = { id: Date.now(), followerId, followingId, createdAt: new Date().toISOString() }
        follows.unshift(newFollow)
        writeFollows(follows)

        // Crea notifica per l'utente seguito (new_follower)
        const users = readUsers()
        const followerUser = users.find((u: any) => String(u.id) === String(followerId))
        if (followerUser) {
            createFollowNotification(followerUser, followingId)
        }

        return withCors(NextResponse.json(newFollow, { status: 201 }))
    } catch (err) {
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// DELETE body: { followerId, followingId }
export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const followerId = body.followerId?.toString().trim()
        const followingId = body.followingId?.toString().trim()
        if (!followerId || !followingId) {
            return withCors(NextResponse.json({ error: 'followerId_and_followingId_required' }, { status: 400 }))
        }
        let follows = readFollows()
        const before = follows.length
        follows = follows.filter((f: any) => !(f.followerId === followerId && f.followingId === followingId))
        writeFollows(follows)
        const removed = before - follows.length
        if (!removed) {
            return withCors(NextResponse.json({ removed: 0, warning: 'relation_not_found' }, { status: 404 }))
        }
        return withCors(NextResponse.json({ removed }))
    } catch (err) {
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}
