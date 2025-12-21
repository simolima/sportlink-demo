export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import {
    readClubs,
    writeClubs,
    readClubMemberships,
    writeClubMemberships
} from '@/lib/file-system'

// OPTIONS /api/clubs - CORS preflight
export async function OPTIONS() {
    return handleOptions()
}

// GET /api/clubs - Get all clubs or filter by sport/city
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const city = searchParams.get('city')
    const search = searchParams.get('search')

    let clubs = readClubs()

    // Filter by sport (supports multiple sports in sports array)
    if (sport && sport !== 'all') {
        clubs = clubs.filter((club: any) =>
            Array.isArray(club.sports) && club.sports.includes(sport)
        )
    }

    // Filter by city
    if (city) {
        clubs = clubs.filter((club: any) =>
            club.city.toLowerCase().includes(city.toLowerCase())
        )
    }

    // Search by name
    if (search) {
        clubs = clubs.filter((club: any) =>
            club.name.toLowerCase().includes(search.toLowerCase()) ||
            club.description.toLowerCase().includes(search.toLowerCase())
        )
    }

    return withCors(NextResponse.json(clubs))
}

// POST /api/clubs - Create a new club
export async function POST(request: Request) {
    const body = await request.json()
    const { name, description, sports, city, address, logoUrl, coverUrl, website, foundedYear, createdBy } = body

    if (!name || !sports || !city) {
        return withCors(NextResponse.json({ error: 'name, sports, and city required' }, { status: 400 }))
    }

    const clubs = readClubs()
    const creatorId = createdBy ? createdBy.toString() : null

    const newClub = {
        id: Date.now(),
        name,
        description: description || '',
        sports: Array.isArray(sports) ? sports : [sports],
        city,
        address: address || '',
        logoUrl: logoUrl || null,
        coverUrl: coverUrl || null,
        website: website || '',
        foundedYear: foundedYear || null,
        followersCount: 0,
        membersCount: 0,
        verified: false,
        createdBy: creatorId,
        createdAt: new Date().toISOString()
    }

    clubs.push(newClub)
    writeClubs(clubs)

    // Ensure creator is added as Admin if provided
    if (creatorId) {
        const memberships = readClubMemberships()
        const alreadyMember = memberships.find((m: any) =>
            m.clubId.toString() === newClub.id.toString() &&
            m.userId.toString() === creatorId &&
            m.isActive
        )

        if (!alreadyMember) {
            memberships.push({
                id: Date.now(),
                clubId: newClub.id,
                userId: creatorId,
                role: 'Admin',
                position: '',
                permissions: [
                    'create_opportunities',
                    'manage_applications',
                    'manage_members',
                    'edit_club_info'
                ],
                joinedAt: new Date().toISOString(),
                isActive: true
            })
            writeClubMemberships(memberships)
        }
    }

    return withCors(NextResponse.json(newClub, { status: 201 }))
}

// PUT /api/clubs - Update a club
export async function PUT(request: Request) {
    const body = await request.json()
    const clubs = readClubs()

    const index = clubs.findIndex((c: any) => c.id.toString() === body.id.toString())
    if (index === -1) {
        return withCors(NextResponse.json({ error: 'Club not found' }, { status: 404 }))
    }

    clubs[index] = { ...clubs[index], ...body }
    writeClubs(clubs)

    return withCors(NextResponse.json(clubs[index]))
}

// DELETE /api/clubs - Delete a club
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return withCors(NextResponse.json({ error: 'ID required' }, { status: 400 }))
    }

    const clubs = readClubs()
    const filtered = clubs.filter((c: any) => c.id.toString() !== id)

    if (clubs.length === filtered.length) {
        return withCors(NextResponse.json({ error: 'Club not found' }, { status: 404 }))
    }

    writeClubs(filtered)
    return withCors(NextResponse.json({ success: true }))
}
