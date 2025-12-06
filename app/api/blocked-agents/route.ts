import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const blockedAgentsPath = path.join(process.cwd(), 'data', 'blocked-agents.json')
const usersPath = path.join(process.cwd(), 'data', 'users.json')

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

// GET /api/blocked-agents - Get blocked agents
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')

    let blocked = readBlockedAgents()
    const users = readUsers()

    // Filter by player
    if (playerId) {
        blocked = blocked.filter((b: any) => b.playerId.toString() === playerId)
    }

    // Filter by agent
    if (agentId) {
        blocked = blocked.filter((b: any) => b.agentId.toString() === agentId)
    }

    // Enrich with user data
    const enriched = blocked.map((b: any) => {
        const player = users.find((u: any) => u.id.toString() === b.playerId.toString())
        const agent = users.find((u: any) => u.id.toString() === b.agentId.toString())
        
        return {
            ...b,
            player: player ? {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                avatarUrl: player.avatarUrl
            } : null,
            agent: agent ? {
                id: agent.id,
                firstName: agent.firstName,
                lastName: agent.lastName,
                avatarUrl: agent.avatarUrl
            } : null
        }
    })

    return NextResponse.json(enriched)
}

// POST /api/blocked-agents - Block an agent
export async function POST(request: Request) {
    const body = await request.json()
    const { playerId, agentId, reason } = body

    if (!playerId || !agentId) {
        return NextResponse.json({ error: 'playerId and agentId required' }, { status: 400 })
    }

    const blocked = readBlockedAgents()

    // Check if already blocked
    const existing = blocked.find((b: any) => 
        b.playerId.toString() === playerId.toString() &&
        b.agentId.toString() === agentId.toString()
    )

    if (existing) {
        return NextResponse.json({ error: 'Agent already blocked' }, { status: 400 })
    }

    const newBlock = {
        id: Date.now(),
        playerId,
        agentId,
        reason: reason || '',
        blockedAt: new Date().toISOString()
    }

    blocked.push(newBlock)
    writeBlockedAgents(blocked)

    return NextResponse.json(newBlock, { status: 201 })
}

// DELETE /api/blocked-agents - Unblock an agent
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const playerId = searchParams.get('playerId')
    const agentId = searchParams.get('agentId')

    const blocked = readBlockedAgents()

    // Unblock by ID
    if (id) {
        const filtered = blocked.filter((b: any) => b.id.toString() !== id)
        
        if (blocked.length === filtered.length) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 })
        }
        
        writeBlockedAgents(filtered)
        return NextResponse.json({ success: true })
    }

    // Unblock by playerId + agentId
    if (playerId && agentId) {
        const filtered = blocked.filter((b: any) => 
            !(b.playerId.toString() === playerId && b.agentId.toString() === agentId)
        )
        
        if (blocked.length === filtered.length) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 })
        }
        
        writeBlockedAgents(filtered)
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'id or (playerId + agentId) required' }, { status: 400 })
}
