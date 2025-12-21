import { NextResponse } from 'next/server'
import {
    readAffiliations,
    writeAffiliations,
    readBlockedAgents,
    writeBlockedAgents,
    readUsers
} from '@/lib/file-system'
import {
    createAffiliationRequestNotification,
    createAffiliationStatusNotification,
    createAffiliationRemovedNotification
} from '@/lib/notification-helpers'

// GET /api/affiliations - Get affiliations for a user (agent or player)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const playerId = searchParams.get('playerId')
    const status = searchParams.get('status')

    let affiliations = readAffiliations()
    const users = readUsers()

    // Filter by agent
    if (agentId) {
        affiliations = affiliations.filter((a: any) => a.agentId.toString() === agentId)
    }

    // Filter by player
    if (playerId) {
        affiliations = affiliations.filter((a: any) => a.playerId.toString() === playerId)
    }

    // Filter by status
    if (status) {
        affiliations = affiliations.filter((a: any) => a.status === status)
    }

    // Enrich with user data
    const enriched = affiliations.map((aff: any) => {
        const agent = users.find((u: any) => u.id.toString() === aff.agentId.toString())
        const player = users.find((u: any) => u.id.toString() === aff.playerId.toString())
        return {
            ...aff,
            agent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, avatarUrl: agent.avatarUrl } : null,
            player: player ? { id: player.id, firstName: player.firstName, lastName: player.lastName, avatarUrl: player.avatarUrl, sport: player.sport } : null
        }
    })

    return NextResponse.json(enriched)
}

// POST /api/affiliations - Create affiliation request
export async function POST(request: Request) {
    const body = await request.json()
    const { agentId, playerId, notes } = body

    if (!agentId || !playerId) {
        return NextResponse.json({ error: 'agentId and playerId required' }, { status: 400 })
    }

    // Check if player has blocked this agent
    const blockedAgents = readBlockedAgents()
    const isBlocked = blockedAgents.some((b: any) =>
        b.playerId.toString() === playerId.toString() &&
        b.agentId.toString() === agentId.toString()
    )

    if (isBlocked) {
        return NextResponse.json({ error: 'Operation not permitted' }, { status: 403 })
    }

    // Check if affiliation already exists
    const affiliations = readAffiliations()
    const existing = affiliations.find((a: any) =>
        a.agentId.toString() === agentId.toString() &&
        a.playerId.toString() === playerId.toString() &&
        (a.status === 'pending' || a.status === 'accepted')
    )

    if (existing) {
        return NextResponse.json({ error: 'Affiliation already exists' }, { status: 400 })
    }

    const newAffiliation = {
        id: Date.now(),
        agentId,
        playerId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        notes: notes || ''
    }

    affiliations.push(newAffiliation)
    writeAffiliations(affiliations)

    // Create notification for player
    createAffiliationRequestNotification(agentId, playerId, newAffiliation.id)

    return NextResponse.json(newAffiliation, { status: 201 })
}

// PUT /api/affiliations - Update affiliation status (accept/reject)
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, status, playerId } = body

    if (!id || !status) {
        return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const affiliations = readAffiliations()
    const index = affiliations.findIndex((a: any) => a.id.toString() === id.toString())

    if (index === -1) {
        return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })
    }

    const affiliation = affiliations[index]

    // Check if requester is the player
    if (playerId && affiliation.playerId.toString() !== playerId.toString()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    affiliation.status = status
    affiliation.respondedAt = new Date().toISOString()

    if (status === 'accepted') {
        affiliation.affiliatedAt = new Date().toISOString()
    }

    affiliations[index] = affiliation
    writeAffiliations(affiliations)

    // Create notification for agent
    createAffiliationStatusNotification(affiliation, status)

    return NextResponse.json(affiliation)
}

// DELETE /api/affiliations - Remove affiliation or block agent
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const block = searchParams.get('block') === 'true'
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')

    if (!id && !playerId) {
        return NextResponse.json({ error: 'id or playerId required' }, { status: 400 })
    }

    const affiliations = readAffiliations()

    if (id) {
        const affiliation = affiliations.find((a: any) => a.id.toString() === id.toString())

        if (!affiliation) {
            return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })
        }

        // If block is true, add to blocked agents
        if (block) {
            const blockedAgents = readBlockedAgents()
            const newBlock = {
                id: Date.now(),
                playerId: affiliation.playerId,
                agentId: affiliation.agentId,
                blockedAt: new Date().toISOString(),
                reason: 'Blocked by player'
            }
            blockedAgents.push(newBlock)
            writeBlockedAgents(blockedAgents)
        }

        // Create notification based on who removed the affiliation
        if (affiliation.status === 'accepted') {
            createAffiliationRemovedNotification(affiliation, playerId || undefined, agentId || undefined)
        }

        // Remove affiliation
        const filtered = affiliations.filter((a: any) => a.id.toString() !== id.toString())
        writeAffiliations(filtered)

        return NextResponse.json({ success: true, blocked: block })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
