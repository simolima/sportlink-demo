import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const opportunitiesPath = path.join(process.cwd(), 'data', 'opportunities.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')
const applicationsPath = path.join(process.cwd(), 'data', 'applications.json')

function readOpportunities() {
    const data = fs.readFileSync(opportunitiesPath, 'utf-8')
    return JSON.parse(data)
}

function writeOpportunities(opportunities: any[]) {
    fs.writeFileSync(opportunitiesPath, JSON.stringify(opportunities, null, 2))
}

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

function readApplications() {
    const data = fs.readFileSync(applicationsPath, 'utf-8')
    return JSON.parse(data)
}

// GET /api/opportunities - Get opportunities with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const type = searchParams.get('type')
    const clubId = searchParams.get('clubId')
    const level = searchParams.get('level')
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const search = searchParams.get('search')

    let opportunities = readOpportunities()
    const clubs = readClubs()
    const applications = readApplications()

    // Filter active only (default: true)
    if (activeOnly) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        opportunities = opportunities.filter((a: any) => {
            // Check if isActive flag is true
            if (!a.isActive) return false
            // Check if expiry date is in future (or allow same day)
            try {
                const expiry = new Date(a.expiryDate)
                const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate())
                return expiryDate >= today
            } catch (e) {
                console.error('Invalid date format:', a.expiryDate)
                return false
            }
        })
    }

    // Filter by sport
    if (sport && sport !== 'all') {
        opportunities = opportunities.filter((a: any) => a.sport === sport)
    }

    // Filter by type
    if (type && type !== 'all') {
        opportunities = opportunities.filter((a: any) => a.type === type)
    }

    // Filter by club
    if (clubId) {
        opportunities = opportunities.filter((a: any) => a.clubId.toString() === clubId)
    }

    // Filter by level
    if (level && level !== 'all') {
        opportunities = opportunities.filter((a: any) => a.level === level)
    }

    // Filter by city
    if (city) {
        opportunities = opportunities.filter((a: any) =>
            a.city?.toLowerCase().includes(city.toLowerCase()) ||
            a.location?.toLowerCase().includes(city.toLowerCase())
        )
    }

    // Search in title/description
    if (search) {
        opportunities = opportunities.filter((a: any) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.description.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Enrich with club data and applications count
    const enriched = opportunities.map((ann: any) => {
        const club = clubs.find((c: any) => c.id.toString() === ann.clubId.toString())
        const appCount = applications.filter((app: any) => {
            const appOpportunityId = app.opportunityId || app.announcementId
            return appOpportunityId?.toString() === ann.id.toString()
        }).length

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

// POST /api/opportunities - Create new opportunity
export async function POST(request: Request) {
    const body = await request.json()
    const opportunities = readOpportunities()

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

    const newOpportunity = {
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

    opportunities.push(newOpportunity)
    writeOpportunities(opportunities)

    return NextResponse.json(newOpportunity, { status: 201 })
}

// PUT /api/opportunities - Update opportunity
export async function PUT(request: Request) {
    const body = await request.json()
    const opportunities = readOpportunities()

    const index = opportunities.findIndex((a: any) => a.id.toString() === body.id.toString())
    if (index === -1) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    opportunities[index] = {
        ...opportunities[index],
        ...body,
        updatedAt: new Date().toISOString()
    }

    writeOpportunities(opportunities)
    return NextResponse.json(opportunities[index])
}

// DELETE /api/opportunities - Delete opportunity
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const opportunities = readOpportunities()
    const filtered = opportunities.filter((a: any) => a.id.toString() !== id)

    if (opportunities.length === filtered.length) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    writeOpportunities(filtered)
    return NextResponse.json({ success: true })
}
