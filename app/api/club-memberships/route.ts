import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import {
    readClubMemberships,
    writeClubMemberships,
    readClubs,
    readUsers
} from '@/lib/file-system'

export const runtime = 'nodejs'

// Preflight
export async function OPTIONS(req: Request) {
    return handleOptions()
}

// GET /api/club-memberships - Get memberships
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')
    const userId = searchParams.get('userId')

    let memberships = readClubMemberships()
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

    return withCors(NextResponse.json(enriched))
}

// POST /api/club-memberships - Add member to club
export async function POST(request: Request) {
    const body = await request.json()
    const { clubId, userId, role, position, permissions } = body

    if (!clubId || !userId || !role) {
        return withCors(NextResponse.json({ error: 'clubId, userId, and role required' }, { status: 400 }))
    }

    const memberships = readClubMemberships()

    // Check if membership already exists
    const existing = memberships.find((m: any) =>
        m.clubId.toString() === clubId.toString() &&
        m.userId.toString() === userId.toString() &&
        m.isActive
    )

    if (existing) {
        return withCors(NextResponse.json({ error: 'User is already a member of this club' }, { status: 400 }))
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
    writeClubMemberships(memberships)

    return withCors(NextResponse.json(newMembership, { status: 201 }))
}

// PUT /api/club-memberships - Update membership
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, role, position, permissions, isActive } = body

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const memberships = readClubMemberships()
    const index = memberships.findIndex((m: any) => m.id.toString() === id.toString())

    if (index === -1) {
        return withCors(NextResponse.json({ error: 'Membership not found' }, { status: 404 }))
    }

    if (role !== undefined) memberships[index].role = role
    if (position !== undefined) memberships[index].position = position
    if (permissions !== undefined) memberships[index].permissions = permissions
    if (isActive !== undefined) memberships[index].isActive = isActive

    writeClubMemberships(memberships)
    return withCors(NextResponse.json(memberships[index]))
}

// DELETE /api/club-memberships - Remove member
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const memberships = readClubMemberships()
    const filtered = memberships.filter((m: any) => m.id.toString() !== id)

    if (memberships.length === filtered.length) {
        return withCors(NextResponse.json({ error: 'Membership not found' }, { status: 404 }))
    }

    writeClubMemberships(filtered)
    return withCors(NextResponse.json({ success: true }))
}
