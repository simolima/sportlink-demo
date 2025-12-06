import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const announcementsPath = path.join(process.cwd(), 'data', 'announcements.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')
const applicationsPath = path.join(process.cwd(), 'data', 'applications.json')

function readAnnouncements() {
    const data = fs.readFileSync(announcementsPath, 'utf-8')
    return JSON.parse(data)
}

function writeAnnouncements(announcements: any[]) {
    fs.writeFileSync(announcementsPath, JSON.stringify(announcements, null, 2))
}

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

function readApplications() {
    const data = fs.readFileSync(applicationsPath, 'utf-8')
    return JSON.parse(data)
}

// GET /api/announcements - Get announcements with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const type = searchParams.get('type')
    const clubId = searchParams.get('clubId')
    const level = searchParams.get('level')
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const search = searchParams.get('search')

    let announcements = readAnnouncements()
    const clubs = readClubs()
    const applications = readApplications()

    // Filter active only
    if (activeOnly) {
        const now = new Date()
        announcements = announcements.filter((a: any) => 
            a.isActive && new Date(a.expiryDate) > now
        )
    }

    // Filter by sport
    if (sport && sport !== 'all') {
        announcements = announcements.filter((a: any) => a.sport === sport)
    }

    // Filter by type
    if (type && type !== 'all') {
        announcements = announcements.filter((a: any) => a.type === type)
    }

    // Filter by club
    if (clubId) {
        announcements = announcements.filter((a: any) => a.clubId.toString() === clubId)
    }

    // Filter by level
    if (level && level !== 'all') {
        announcements = announcements.filter((a: any) => a.level === level)
    }

    // Filter by city
    if (city) {
        announcements = announcements.filter((a: any) => 
            a.city?.toLowerCase().includes(city.toLowerCase()) ||
            a.location?.toLowerCase().includes(city.toLowerCase())
        )
    }

    // Search in title/description
    if (search) {
        announcements = announcements.filter((a: any) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.description.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Enrich with club data and applications count
    const enriched = announcements.map((ann: any) => {
        const club = clubs.find((c: any) => c.id.toString() === ann.clubId.toString())
        const appCount = applications.filter((app: any) => app.announcementId.toString() === ann.id.toString()).length
        
        return {
            ...ann,
            club: club ? { id: club.id, name: club.name, logoUrl: club.logoUrl, verified: club.verified } : null,
            applicationsCount: appCount
        }
    })

    // Sort by date (most recent first)
    enriched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(enriched)
}

// POST /api/announcements - Create new announcement
export async function POST(request: Request) {
    const body = await request.json()
    const announcements = readAnnouncements()

    // Validate required fields
    const required = ['clubId', 'title', 'type', 'sport', 'roleRequired', 'description', 'location', 'expiryDate', 'createdBy']
    for (const field of required) {
        if (!body[field]) {
            return NextResponse.json({ error: `${field} is required` }, { status: 400 })
        }
    }

    // Validate expiry date (max 6 months)
    const expiryDate = new Date(body.expiryDate)
    const maxExpiry = new Date()
    maxExpiry.setMonth(maxExpiry.getMonth() + 6)
    
    if (expiryDate > maxExpiry) {
        return NextResponse.json({ error: 'Expiry date cannot exceed 6 months' }, { status: 400 })
    }

    const newAnnouncement = {
        id: Date.now(),
        clubId: body.clubId,
        title: body.title,
        type: body.type,
        sport: body.sport,
        roleRequired: body.roleRequired,
        position: body.position || '',
        description: body.description,
        location: body.location,
        city: body.city || '',
        country: body.country || '',
        salary: body.salary || '',
        contractType: body.contractType || '',
        level: body.level || '',
        requirements: body.requirements || '',
        expiryDate: body.expiryDate,
        isActive: true,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString()
    }

    announcements.push(newAnnouncement)
    writeAnnouncements(announcements)

    return NextResponse.json(newAnnouncement, { status: 201 })
}

// PUT /api/announcements - Update announcement
export async function PUT(request: Request) {
    const body = await request.json()
    const announcements = readAnnouncements()

    const index = announcements.findIndex((a: any) => a.id.toString() === body.id.toString())
    if (index === -1) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    announcements[index] = {
        ...announcements[index],
        ...body,
        updatedAt: new Date().toISOString()
    }

    writeAnnouncements(announcements)
    return NextResponse.json(announcements[index])
}

// DELETE /api/announcements - Delete announcement
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const announcements = readAnnouncements()
    const filtered = announcements.filter((a: any) => a.id.toString() !== id)

    if (announcements.length === filtered.length) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    writeAnnouncements(filtered)
    return NextResponse.json({ success: true })
}
