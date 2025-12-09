import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const affiliationsPath = path.join(process.cwd(), 'data', 'affiliations.json')
const blockedAgentsPath = path.join(process.cwd(), 'data', 'blocked-agents.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json')

function readAffiliations() {
    const data = fs.readFileSync(affiliationsPath, 'utf-8')
    return JSON.parse(data)
}

function writeAffiliations(affiliations: any[]) {
    fs.writeFileSync(affiliationsPath, JSON.stringify(affiliations, null, 2))
}

function readBlockedAgents() {
    const data = fs.readFileSync(blockedAgentsPath, 'utf-8')
    return JSON.parse(data)
}

function writeBlockedAgents(blocked: any[]) {
    fs.writeFileSync(blockedAgentsPath, JSON.stringify(blocked, null, 2))
}

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
}

function readNotifications() {
    const data = fs.readFileSync(notificationsPath, 'utf-8')
    return JSON.parse(data)
}

function writeNotifications(notifications: any[]) {
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2))
}

function createNotification(userId: string | number, type: string, title: string, message: string, metadata: any = {}) {
    const notifications = readNotifications()
    const newNotification = {
        id: Date.now(),
        userId,
        type,
        title,
        message,
        metadata,
        read: false,
        createdAt: new Date().toISOString()
    }
    notifications.push(newNotification)
    writeNotifications(notifications)
    return newNotification
}

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
    const users = readUsers()
    const agent = users.find((u: any) => u.id.toString() === agentId.toString())
    if (agent) {
        createNotification(
            playerId,
            'affiliation_request',
            'Nuova richiesta di affiliazione',
            `${agent.firstName} ${agent.lastName} ha richiesto di diventare il tuo agente.`,
            { affiliationId: newAffiliation.id, agentId, agentName: `${agent.firstName} ${agent.lastName}` }
        )
    }

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
    const users = readUsers()
    const player = users.find((u: any) => u.id.toString() === affiliation.playerId.toString())
    if (player) {
        const notifTitle = status === 'accepted'
            ? 'Richiesta di affiliazione accettata'
            : 'Richiesta di affiliazione rifiutata'
        const notifMessage = status === 'accepted'
            ? `${player.firstName} ${player.lastName} ha accettato la tua richiesta di affiliazione.`
            : `${player.firstName} ${player.lastName} ha rifiutato la tua richiesta di affiliazione.`

        createNotification(
            affiliation.agentId,
            status === 'accepted' ? 'affiliation_accepted' : 'affiliation_rejected',
            notifTitle,
            notifMessage,
            { affiliationId: affiliation.id, playerId: affiliation.playerId, playerName: `${player.firstName} ${player.lastName}` }
        )
    }

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
            const users = readUsers()

            // Check who is removing: if playerId is passed, it's the player removing the agent
            // If agentId is passed, it's the agent removing the player
            if (playerId && playerId.toString() === affiliation.playerId.toString()) {
                // Player is removing the agent -> notify the agent
                const player = users.find((u: any) => u.id.toString() === affiliation.playerId.toString())
                if (player) {
                    createNotification(
                        affiliation.agentId,
                        'affiliation_removed',
                        'Affiliazione terminata',
                        `${player.firstName} ${player.lastName} ha terminato l'affiliazione con te.`,
                        { affiliationId: affiliation.id, playerId: affiliation.playerId, playerName: `${player.firstName} ${player.lastName}` }
                    )
                }
            } else if (agentId && agentId.toString() === affiliation.agentId.toString()) {
                // Agent is removing the player -> notify the player
                const agent = users.find((u: any) => u.id.toString() === affiliation.agentId.toString())
                if (agent) {
                    createNotification(
                        affiliation.playerId,
                        'affiliation_removed',
                        'Affiliazione terminata',
                        `${agent.firstName} ${agent.lastName} ha terminato l'affiliazione con te.`,
                        { affiliationId: affiliation.id, agentId: affiliation.agentId, agentName: `${agent.firstName} ${agent.lastName}` }
                    )
                }
            }
        }

        // Remove affiliation
        const filtered = affiliations.filter((a: any) => a.id.toString() !== id.toString())
        writeAffiliations(filtered)

        return NextResponse.json({ success: true, blocked: block })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
