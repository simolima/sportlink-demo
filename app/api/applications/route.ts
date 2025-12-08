import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const applicationsPath = path.join(process.cwd(), 'data', 'applications.json')
const opportunitiesPath = path.join(process.cwd(), 'data', 'opportunities.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')
const clubsPath = path.join(process.cwd(), 'data', 'clubs.json')

function ensureFile(p: string) {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(path.dirname(p), { recursive: true })
        fs.writeFileSync(p, '[]', 'utf-8')
    }
}

function readJson(p: string) {
    ensureFile(p)
    const data = fs.readFileSync(p, 'utf-8') || '[]'
    try { return JSON.parse(data) } catch { return [] }
}

function writeApplications(applications: any[]) {
    ensureFile(applicationsPath)
    fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2))
}

function readApplications() { return readJson(applicationsPath) }
function readOpportunities() { return readJson(opportunitiesPath) }
function readUsers() { return readJson(usersPath) }
function readClubs() { return readJson(clubsPath) }

export async function OPTIONS(req: Request) {
    return handleOptions()
}

// GET /api/applications - Get applications with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('opportunityId')
    const applicantId = searchParams.get('applicantId')
    const agentId = searchParams.get('agentId')
    const clubId = searchParams.get('clubId')
    const status = searchParams.get('status')

    let applications = readApplications()
    const opportunities = readOpportunities()
    const users = readUsers()
    const clubs = readClubs()

    // Filter by opportunity
    if (opportunityId) {
        applications = applications.filter((app: any) => {
            return app.opportunityId?.toString() === opportunityId
        })
    }

    // Filter by applicant
    if (applicantId) {
        applications = applications.filter((app: any) => {
            return app.applicantId?.toString() === applicantId
        })
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
            return opportunityIds.includes(app.opportunityId?.toString())
        })
    }

    // Filter by status or exclude withdrawn by default
    if (status) {
        applications = applications.filter((app: any) => app.status === status)
    } else {
        applications = applications.filter((app: any) => app.status !== 'withdrawn')
    }

    // Enrich with related data
    const enriched = applications.map((app: any) => {
        const opportunity = opportunities.find((o: any) => o.id.toString() === app.opportunityId?.toString())
        const applicant = users.find((u: any) => u.id.toString() === app.applicantId?.toString())
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
            player: applicant ? {
                id: applicant.id,
                firstName: applicant.firstName,
                lastName: applicant.lastName,
                avatarUrl: applicant.avatarUrl,
                professionalRole: applicant.professionalRole,
                sport: applicant.sport
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

    return withCors(NextResponse.json(enriched))
}

// POST /api/applications - Create new application
export async function POST(request: Request) {
    const body = await request.json()
    const { opportunityId, applicantId, agentId, message } = body

    if (!opportunityId || !applicantId) {
        return withCors(NextResponse.json({ error: 'opportunityId and applicantId required' }, { status: 400 }))
    }

    const applications = readApplications()

    // Check if application already exists for this applicant and opportunity
    const existing = applications.find((app: any) => {
        return app.opportunityId?.toString() === opportunityId.toString() &&
            app.applicantId?.toString() === applicantId.toString() &&
            app.status !== 'withdrawn'
    })

    if (existing) {
        return withCors(NextResponse.json({ error: 'Already applied to this opportunity' }, { status: 400 }))
    }

    const newApplication = {
        id: Date.now(),
        opportunityId: opportunityId,
        applicantId: applicantId,
        agentId: agentId || undefined,
        status: 'pending',
        message: message || '',
        appliedAt: new Date().toISOString()
    }

    applications.push(newApplication)
    writeApplications(applications)

    return withCors(NextResponse.json(newApplication, { status: 201 }))
}

// PUT /api/applications - Update application status
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, status, reviewedBy } = body

    if (!id || !status) {
        return withCors(NextResponse.json({ error: 'id and status required' }, { status: 400 }))
    }

    const applications = readApplications()
    const index = applications.findIndex((app: any) => app.id.toString() === id.toString())

    if (index === -1) {
        return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }))
    }

    applications[index].status = status
    applications[index].updatedAt = new Date().toISOString()

    if (reviewedBy) {
        applications[index].reviewedBy = reviewedBy
    }

    writeApplications(applications)
    return withCors(NextResponse.json(applications[index]))
}

// DELETE /api/applications - Withdraw or delete application
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const withdraw = searchParams.get('withdraw') === 'true'

    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const applications = readApplications()

    if (withdraw) {
        // Set status to withdrawn instead of deleting
        const index = applications.findIndex((app: any) => app.id.toString() === id)
        if (index === -1) {
            return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }))
        }

        applications[index].status = 'withdrawn'
        applications[index].updatedAt = new Date().toISOString()
        writeApplications(applications)
        return withCors(NextResponse.json({ success: true, withdrawn: true }))
    } else {
        // Hard delete
        const filtered = applications.filter((app: any) => app.id.toString() !== id)
        if (applications.length === filtered.length) {
            return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }))
        }

        writeApplications(filtered)
        return withCors(NextResponse.json({ success: true }))
    }
}
