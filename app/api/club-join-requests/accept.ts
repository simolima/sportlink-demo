import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const requestsPath = path.join(process.cwd(), 'data', 'club-join-requests.json')
const membershipsPath = path.join(process.cwd(), 'data', 'club-memberships.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')

function readRequests() {
    const data = fs.readFileSync(requestsPath, 'utf-8')
    return JSON.parse(data)
}
function writeRequests(requests: any[]) {
    fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2))
}
function readMemberships() {
    const data = fs.readFileSync(membershipsPath, 'utf-8')
    return JSON.parse(data)
}
function writeMemberships(memberships: any[]) {
    fs.writeFileSync(membershipsPath, JSON.stringify(memberships, null, 2))
}
function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
}

// POST /api/club-join-requests/accept
export async function POST(request: Request) {
    const body = await request.json()
    const { requestId, respondedBy } = body
    if (!requestId) {
        return NextResponse.json({ error: 'requestId required' }, { status: 400 })
    }
    let requests = readRequests()
    const reqIndex = requests.findIndex((r: any) => r.id.toString() === requestId.toString())
    if (reqIndex === -1) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    if (requests[reqIndex].status !== 'pending') {
        return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }
    // Aggiorna la richiesta a accepted
    requests[reqIndex].status = 'accepted'
    requests[reqIndex].respondedAt = new Date().toISOString()
    if (respondedBy) requests[reqIndex].respondedBy = respondedBy
    writeRequests(requests)

    // Crea la membership attiva
    const memberships = readMemberships()
    const { clubId, userId, requestedRole, requestedPosition } = requests[reqIndex]
    // Check se già membro attivo
    const alreadyMember = memberships.find((m: any) => m.clubId.toString() === clubId.toString() && m.userId.toString() === userId.toString() && m.isActive)
    if (alreadyMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }
    const newMembership = {
        id: Date.now(),
        clubId,
        userId,
        role: requestedRole,
        position: requestedPosition || '',
        permissions: [],
        joinedAt: new Date().toISOString(),
        isActive: true
    }
    memberships.push(newMembership)
    writeMemberships(memberships)

    return NextResponse.json({ success: true, membership: newMembership })
}
