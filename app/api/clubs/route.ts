import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

function writeClubs(clubs: any[]) {
    fs.writeFileSync(clubsPath, JSON.stringify(clubs, null, 2))
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

    return NextResponse.json(clubs)
}

// POST /api/clubs - Create a new club
export async function POST(request: Request) {
    const body = await request.json()
    const { name, description, sports, city, address, logoUrl, coverUrl, website, foundedYear } = body

    if (!name || !sports || !city) {
        return NextResponse.json({ error: 'name, sports, and city required' }, { status: 400 })
    }

    const clubs = readClubs()

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
        createdAt: new Date().toISOString()
    }

    clubs.push(newClub)
    writeClubs(clubs)

    return NextResponse.json(newClub, { status: 201 })
}

// PUT /api/clubs - Update a club
export async function PUT(request: Request) {
    const body = await request.json()
    const clubs = readClubs()

    const index = clubs.findIndex((c: any) => c.id.toString() === body.id.toString())
    if (index === -1) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    clubs[index] = { ...clubs[index], ...body }
    writeClubs(clubs)

    return NextResponse.json(clubs[index])
}

// DELETE /api/clubs - Delete a club
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const clubs = readClubs()
    const filtered = clubs.filter((c: any) => c.id.toString() !== id)

    if (clubs.length === filtered.length) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    writeClubs(filtered)
    return NextResponse.json({ success: true })
}
