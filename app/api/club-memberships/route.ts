import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const membershipsPath = path.join(process.cwd(), 'data', 'club-memberships.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')

function readMemberships() {
    const data = fs.readFileSync(membershipsPath, 'utf-8')
    return JSON.parse(data)
}

function writeMemberships(memberships: any[]) {
    fs.writeFileSync(membershipsPath, JSON.stringify(memberships, null, 2))
}

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
}

// GET /api/club-memberships - Get memberships
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')
    const userId = searchParams.get('userId')

    let memberships = readMemberships()
    const clubs = readClubs()
    const users = readUsers()

    // Filter by club
    if (clubId) {
        memberships = memberships.filter((m: any) => m.clubId.toString() === clubId)
    }

    // Filter by user
    if (userId) {
        memberships = memberships.filter((m: any) => m.userId.toString() === userId)
    }

    // Enrich with user and club data
    const enriched = memberships.map((m: any) => {
        const club = clubs.find((c: any) => c.id.toString() === m.clubId.toString())
        const user = users.find((u: any) => u.id.toString() === m.userId.toString())
        
        return {
            ...m,
            club: club ? {
                id: club.id,
                name: club.name,
                logoUrl: club.logoUrl,
                sports: club.sports
            } : null,
            user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                professionalRole: user.professionalRole
            } : null
        }
    })

    return NextResponse.json(enriched)
}

// POST /api/club-memberships - Add member to club
export async function POST(request: Request) {
    const body = await request.json()
    const { clubId, userId, role, position, permissions } = body

    if (!clubId || !userId || !role) {
        return NextResponse.json({ error: 'clubId, userId, and role required' }, { status: 400 })
    }

    const memberships = readMemberships()

    // Check if membership already exists
    const existing = memberships.find((m: any) => 
        m.clubId.toString() === clubId.toString() &&
        m.userId.toString() === userId.toString() &&
        m.isActive
    )

    if (existing) {
        return NextResponse.json({ error: 'User is already a member of this club' }, { status: 400 })
    }

    const newMembership = {
        id: Date.now(),
        clubId,
        userId,
        role,
        position: position || '',
        permissions: permissions || [],
        joinedAt: new Date().toISOString(),
        isActive: true
    }

    memberships.push(newMembership)
    writeMemberships(memberships)

    return NextResponse.json(newMembership, { status: 201 })
}

// PUT /api/club-memberships - Update membership
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, role, position, permissions, isActive } = body

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const memberships = readMemberships()
    const index = memberships.findIndex((m: any) => m.id.toString() === id.toString())

    if (index === -1) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (role !== undefined) memberships[index].role = role
    if (position !== undefined) memberships[index].position = position
    if (permissions !== undefined) memberships[index].permissions = permissions
    if (isActive !== undefined) memberships[index].isActive = isActive

    writeMemberships(memberships)
    return NextResponse.json(memberships[index])
}

// DELETE /api/club-memberships - Remove member
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const memberships = readMemberships()
    const filtered = memberships.filter((m: any) => m.id.toString() !== id)

    if (memberships.length === filtered.length) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    writeMemberships(filtered)
    return NextResponse.json({ success: true })
}
