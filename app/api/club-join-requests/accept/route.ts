import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors } from '@/lib/cors'

export const runtime = 'nodejs'

const requestsPath = path.join(process.cwd(), 'data', 'club-join-requests.json')
const membershipsPath = path.join(process.cwd(), 'data', 'club-memberships.json')

function ensureFile(p: string) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf-8')
}

function readJson(p: string) {
    ensureFile(p)
    try {
        const data = fs.readFileSync(p, 'utf-8') || '[]'
        return JSON.parse(data)
    } catch {
        return []
    }
}

function writeJson(p: string, data: any[]) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}))
    const { requestId, respondedBy } = body as { requestId?: string | number; respondedBy?: string | number }
    if (!requestId) {
        return withCors(NextResponse.json({ error: 'requestId required' }, { status: 400 }))
    }

    const requests = readJson(requestsPath)
    const idx = requests.findIndex((r: any) => String(r.id) === String(requestId))
    if (idx === -1) {
        return withCors(NextResponse.json({ error: 'Request not found' }, { status: 404 }))
    }
    if (requests[idx].status !== 'pending') {
        return withCors(NextResponse.json({ error: 'Request is not pending' }, { status: 400 }))
    }

    // Update request status
    requests[idx].status = 'accepted'
    requests[idx].respondedAt = new Date().toISOString()
    if (respondedBy) requests[idx].respondedBy = respondedBy
    writeJson(requestsPath, requests)

    // Create membership if not already active
    const memberships = readJson(membershipsPath)
    const { clubId, userId, requestedRole, requestedPosition } = requests[idx]
    const alreadyMember = memberships.find((m: any) => String(m.clubId) === String(clubId) && String(m.userId) === String(userId) && m.isActive !== false)
    if (alreadyMember) {
        return withCors(NextResponse.json({ success: true, alreadyMember: true }))
    }

    const newMembership = {
        id: Date.now(),
        clubId,
        userId,
        role: requestedRole || 'Player',
        position: requestedPosition || '',
        permissions: [],
        joinedAt: new Date().toISOString(),
        isActive: true
    }
    memberships.push(newMembership)
    writeJson(membershipsPath, memberships)

    return withCors(NextResponse.json({ success: true, membership: newMembership }))
}

export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
