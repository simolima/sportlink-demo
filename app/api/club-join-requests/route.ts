import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const requestsPath = path.join(process.cwd(), 'data', 'club-join-requests.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')

function readRequests() {
    const data = fs.readFileSync(requestsPath, 'utf-8')
    return JSON.parse(data)
}

function writeRequests(requests: any[]) {
    fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2))
}

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
}

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

// GET /api/club-join-requests - Get join requests
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let requests = readRequests()
    const users = readUsers()
    const clubs = readClubs()

    // Filter by club
    if (clubId) {
        requests = requests.filter((r: any) => r.clubId.toString() === clubId)
    }

    // Filter by user
    if (userId) {
        requests = requests.filter((r: any) => r.userId.toString() === userId)
    }

    // Filter by status
    if (status) {
        requests = requests.filter((r: any) => r.status === status)
    }

    // Enrich with user and club data
    const enriched = requests.map((r: any) => {
        const user = users.find((u: any) => u.id.toString() === r.userId.toString())
        const club = clubs.find((c: any) => c.id.toString() === r.clubId.toString())
        
        return {
            ...r,
            user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                professionalRole: user.professionalRole,
                sport: user.sport
            } : null,
            club: club ? {
                id: club.id,
                name: club.name,
                logoUrl: club.logoUrl
            } : null
        }
    })

    // Sort by date (most recent first)
    enriched.sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

    return NextResponse.json(enriched)
}

// POST /api/club-join-requests - Create join request
export async function POST(request: Request) {
    const body = await request.json()
    const { clubId, userId, requestedRole, requestedPosition, message } = body

    if (!clubId || !userId || !requestedRole) {
        return NextResponse.json({ error: 'clubId, userId, and requestedRole required' }, { status: 400 })
    }

    const requests = readRequests()

    // Check if request already exists
    const existing = requests.find((r: any) => 
        r.clubId.toString() === clubId.toString() &&
        r.userId.toString() === userId.toString() &&
        r.status === 'pending'
    )

    if (existing) {
        return NextResponse.json({ error: 'Request already pending' }, { status: 400 })
    }

    const newRequest = {
        id: Date.now(),
        clubId,
        userId,
        requestedRole,
        requestedPosition: requestedPosition || '',
        message: message || '',
        status: 'pending',
        requestedAt: new Date().toISOString()
    }

    requests.push(newRequest)
    writeRequests(requests)

    return NextResponse.json(newRequest, { status: 201 })
}

// PUT /api/club-join-requests - Update request status (accept/reject)
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, status, respondedBy } = body

    if (!id || !status) {
        return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const requests = readRequests()
    const index = requests.findIndex((r: any) => r.id.toString() === id.toString())

    if (index === -1) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    requests[index].status = status
    requests[index].respondedAt = new Date().toISOString()
    
    if (respondedBy) {
        requests[index].respondedBy = respondedBy
    }

    writeRequests(requests)
    return NextResponse.json(requests[index])
}

// DELETE /api/club-join-requests - Cancel request
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const requests = readRequests()
    const filtered = requests.filter((r: any) => r.id.toString() !== id)

    if (requests.length === filtered.length) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    writeRequests(filtered)
    return NextResponse.json({ success: true })
}
