import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const applicationsPath = path.join(process.cwd(), 'data', 'applications.json')
const opportunitiesPath = path.join(process.cwd(), 'data', 'opportunities.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')

function readApplications() {
    const data = fs.readFileSync(applicationsPath, 'utf-8')
    return JSON.parse(data)
}

function writeApplications(applications: any[]) {
    fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2))
}

function readOpportunities() {
    const data = fs.readFileSync(opportunitiesPath, 'utf-8')
    return JSON.parse(data)
}

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
}

function readClubs() {
    const data = fs.readFileSync(clubsPath, 'utf-8')
    return JSON.parse(data)
}

// GET /api/applications - Get applications with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('opportunityId') || searchParams.get('announcementId') // Retro-compatibilità
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')
    const clubId = searchParams.get('clubId')
    const status = searchParams.get('status')

    let applications = readApplications()
    const opportunities = readOpportunities()
    const users = readUsers()
    const clubs = readClubs()

    // Filter by opportunity (supporta sia opportunityId che announcementId)
    if (opportunityId) {
        applications = applications.filter((app: any) => {
            const appOpportunityId = app.opportunityId || app.announcementId
            return appOpportunityId?.toString() === opportunityId
        })
    }

    // Filter by player
    if (playerId) {
        applications = applications.filter((app: any) => app.playerId.toString() === playerId)
    }

    // Filter by agent
    if (agentId) {
        applications = applications.filter((app: any) => app.agentId?.toString() === agentId)
    }

    // Filter by club (via opportunity)
    if (clubId) {
        const clubOpportunities = opportunities.filter((o: any) => o.clubId.toString() === clubId)
        const opportunityIds = clubOpportunities.map((o: any) => o.id.toString())
        applications = applications.filter((app: any) => {
            const appOpportunityId = app.opportunityId || app.announcementId
            return opportunityIds.includes(appOpportunityId?.toString())
        })
    }

    // Filter by status
    if (status) {
        applications = applications.filter((app: any) => app.status === status)
    }

    // Enrich with related data
    const enriched = applications.map((app: any) => {
        const appOpportunityId = app.opportunityId || app.announcementId
        const opportunity = opportunities.find((o: any) => o.id.toString() === appOpportunityId?.toString())
        const player = users.find((u: any) => u.id.toString() === app.playerId.toString())
        const agent = app.agentId ? users.find((u: any) => u.id.toString() === app.agentId.toString()) : null
        const club = opportunity ? clubs.find((c: any) => c.id.toString() === opportunity.clubId.toString()) : null

        return {
            ...app,
            opportunity: opportunity ? {
                id: opportunity.id,
                title: opportunity.title,
                type: opportunity.type,
                sport: opportunity.sport,
                club: club ? { id: club.id, name: club.name, logoUrl: club.logoUrl } : null
            } : null,
            announcement: opportunity ? { // @deprecated - per retro-compatibilità
                id: opportunity.id,
                title: opportunity.title,
                type: opportunity.type,
                sport: opportunity.sport,
                club: club ? { id: club.id, name: club.name, logoUrl: club.logoUrl } : null
            } : null,
            player: player ? {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                avatarUrl: player.avatarUrl,
                professionalRole: player.professionalRole,
                sport: player.sport
            } : null,
            agent: agent ? {
                id: agent.id,
                firstName: agent.firstName,
                lastName: agent.lastName,
                avatarUrl: agent.avatarUrl
            } : null
        }
    })

    // Sort by date (most recent first)
    enriched.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

    return NextResponse.json(enriched)
}

// POST /api/applications - Create new application
export async function POST(request: Request) {
    const body = await request.json()
    const { opportunityId, announcementId, playerId, agentId, message } = body
    const finalOpportunityId = opportunityId || announcementId // Retro-compatibilità

    if (!finalOpportunityId || !playerId) {
        return NextResponse.json({ error: 'opportunityId and playerId required' }, { status: 400 })
    }

    const applications = readApplications()

    // Check if application already exists for this player and opportunity
    const existing = applications.find((app: any) => {
        const appOpportunityId = app.opportunityId || app.announcementId
        return appOpportunityId?.toString() === finalOpportunityId.toString() &&
            app.playerId.toString() === playerId.toString() &&
            app.status !== 'withdrawn'
    })

    if (existing) {
        return NextResponse.json({ error: 'Already applied to this opportunity' }, { status: 400 })
    }

    const newApplication = {
        id: Date.now(),
        opportunityId: finalOpportunityId,
        playerId,
        agentId: agentId || undefined,
        status: 'pending',
        message: message || '',
        appliedAt: new Date().toISOString()
    }

    applications.push(newApplication)
    writeApplications(applications)

    return NextResponse.json(newApplication, { status: 201 })
}

// PUT /api/applications - Update application status
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, status, reviewedBy } = body

    if (!id || !status) {
        return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const applications = readApplications()
    const index = applications.findIndex((app: any) => app.id.toString() === id.toString())

    if (index === -1) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    applications[index].status = status
    applications[index].updatedAt = new Date().toISOString()

    if (reviewedBy) {
        applications[index].reviewedBy = reviewedBy
    }

    writeApplications(applications)
    return NextResponse.json(applications[index])
}

// DELETE /api/applications - Withdraw or delete application
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const withdraw = searchParams.get('withdraw') === 'true'

    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const applications = readApplications()

    if (withdraw) {
        // Set status to withdrawn instead of deleting
        const index = applications.findIndex((app: any) => app.id.toString() === id)
        if (index === -1) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        applications[index].status = 'withdrawn'
        applications[index].updatedAt = new Date().toISOString()
        writeApplications(applications)
        return NextResponse.json({ success: true, withdrawn: true })
    } else {
        // Hard delete
        const filtered = applications.filter((app: any) => app.id.toString() !== id)
        if (applications.length === filtered.length) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        writeApplications(filtered)
        return NextResponse.json({ success: true })
    }
}
