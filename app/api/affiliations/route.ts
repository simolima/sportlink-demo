import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// Helper: Create notification in Supabase
async function createNotification(userId: string, type: string, title: string, message: string, metadata: any = {}) {
    try {
        const { data, error } = await supabaseServer
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                metadata,
                read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return null
        }
        return data
    } catch (err) {
        console.error('Exception creating notification:', err)
        return null
    }
}

// Handle preflight requests
export async function OPTIONS(req: Request) {
    return handleOptions()
}

// GET /api/affiliations - Get affiliations for a user (agent or player)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const agentId = searchParams.get('agentId')
        const playerId = searchParams.get('playerId')
        const status = searchParams.get('status')

        let query = supabaseServer
            .from('affiliations')
            .select(`
                *,
                agent:profiles!affiliations_agent_id_fkey(id, first_name, last_name, avatar_url),
                player:profiles!affiliations_player_id_fkey(id, first_name, last_name, avatar_url)
            `)

        // Filter by agent
        if (agentId) {
            query = query.eq('agent_id', agentId)
        }

        // Filter by player
        if (playerId) {
            query = query.eq('player_id', playerId)
        }

        // Filter by status
        if (status) {
            query = query.eq('status', status)
        }

        const { data: affiliations, error } = await query

        if (error) {
            console.error('Supabase GET affiliations error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Map to frontend format (camelCase for compatibility)
        const mapped = (affiliations || []).map((aff: any) => ({
            id: aff.id,
            agentId: aff.agent_id,
            playerId: aff.player_id,
            status: aff.status,
            requestedAt: aff.requested_at,
            respondedAt: aff.responded_at,
            affiliatedAt: aff.affiliated_at,
            notes: aff.notes,
            message: aff.message,
            agent: aff.agent ? {
                id: aff.agent.id,
                firstName: aff.agent.first_name,
                lastName: aff.agent.last_name,
                avatarUrl: aff.agent.avatar_url
            } : null,
            player: aff.player ? {
                id: aff.player.id,
                firstName: aff.player.first_name,
                lastName: aff.player.last_name,
                avatarUrl: aff.player.avatar_url
            } : null
        }))

        return withCors(NextResponse.json(mapped))
    } catch (err: any) {
        console.error('GET /api/affiliations error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/affiliations - Create affiliation request
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { agentId, playerId, notes } = body

        if (!agentId || !playerId) {
            return withCors(NextResponse.json({ error: 'agentId and playerId required' }, { status: 400 }))
        }

        // Check if player has blocked this agent
        const { data: blockedAgents } = await supabaseServer
            .from('blocked_agents')
            .select('*')
            .eq('player_id', playerId)
            .eq('agent_id', agentId)

        if (blockedAgents && blockedAgents.length > 0) {
            return withCors(NextResponse.json({ error: 'Operation not permitted' }, { status: 403 }))
        }

        // Check if affiliation already exists
        const { data: existing } = await supabaseServer
            .from('affiliations')
            .select('*')
            .eq('agent_id', agentId)
            .eq('player_id', playerId)
            .in('status', ['pending', 'accepted'])

        if (existing && existing.length > 0) {
            return withCors(NextResponse.json({ error: 'Affiliation already exists' }, { status: 400 }))
        }

        // Create new affiliation
        const { data: newAffiliation, error } = await supabaseServer
            .from('affiliations')
            .insert({
                agent_id: agentId,
                player_id: playerId,
                status: 'pending',
                requested_at: new Date().toISOString(),
                notes: notes || ''
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating affiliation:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Get agent profile for notification
        const { data: agent } = await supabaseServer
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', agentId)
            .single()

        if (agent) {
            await createNotification(
                playerId,
                'affiliation_request',
                'Nuova richiesta di affiliazione',
                `${agent.first_name} ${agent.last_name} ha richiesto di diventare il tuo agente.`,
                { affiliationId: newAffiliation.id, agentId, agentName: `${agent.first_name} ${agent.last_name}` }
            )
        }

        return withCors(NextResponse.json(newAffiliation, { status: 201 }))
    } catch (err: any) {
        console.error('POST /api/affiliations error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// PUT /api/affiliations - Update affiliation status (accept/reject)
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, status, playerId } = body

        if (!id || !status) {
            return withCors(NextResponse.json({ error: 'id and status required' }, { status: 400 }))
        }

        // Get affiliation
        const { data: affiliation, error: fetchError } = await supabaseServer
            .from('affiliations')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !affiliation) {
            return withCors(NextResponse.json({ error: 'Affiliation not found' }, { status: 404 }))
        }

        // Check if requester is the player
        if (playerId && affiliation.player_id !== playerId) {
            return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
        }

        // Update affiliation
        const updateData: any = {
            status,
            responded_at: new Date().toISOString()
        }

        if (status === 'accepted') {
            updateData.affiliated_at = new Date().toISOString()
        }

        const { data: updated, error: updateError } = await supabaseServer
            .from('affiliations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating affiliation:', updateError)
            return withCors(NextResponse.json({ error: updateError.message }, { status: 500 }))
        }

        // Get player profile for notification
        const { data: player } = await supabaseServer
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', affiliation.player_id)
            .single()

        if (player) {
            const notifTitle = status === 'accepted'
                ? 'Richiesta di affiliazione accettata'
                : 'Richiesta di affiliazione rifiutata'
            const notifMessage = status === 'accepted'
                ? `${player.first_name} ${player.last_name} ha accettato la tua richiesta di affiliazione.`
                : `${player.first_name} ${player.last_name} ha rifiutato la tua richiesta di affiliazione.`

            await createNotification(
                affiliation.agent_id,
                status === 'accepted' ? 'affiliation_accepted' : 'affiliation_rejected',
                notifTitle,
                notifMessage,
                { affiliationId: affiliation.id, playerId: affiliation.player_id, playerName: `${player.first_name} ${player.last_name}` }
            )
        }

        return withCors(NextResponse.json(updated))
    } catch (err: any) {
        console.error('PUT /api/affiliations error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/affiliations - Remove affiliation or block agent
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const block = searchParams.get('block') === 'true'
        const playerId = searchParams.get('playerId')
        const agentId = searchParams.get('agentId')

        if (!id) {
            return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
        }

        // Get affiliation
        const { data: affiliation, error: fetchError } = await supabaseServer
            .from('affiliations')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !affiliation) {
            return withCors(NextResponse.json({ error: 'Affiliation not found' }, { status: 404 }))
        }

        // If block is true, add to blocked agents
        if (block) {
            await supabaseServer
                .from('blocked_agents')
                .insert({
                    player_id: affiliation.player_id,
                    agent_id: affiliation.agent_id,
                    blocked_at: new Date().toISOString(),
                    reason: 'Blocked by player'
                })
        }

        // Create notification if affiliation was accepted
        if (affiliation.status === 'accepted') {
            // Check who is removing: if playerId is passed, it's the player removing the agent
            if (playerId && playerId === affiliation.player_id) {
                // Player is removing the agent -> notify the agent
                const { data: player } = await supabaseServer
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', affiliation.player_id)
                    .single()

                if (player) {
                    await createNotification(
                        affiliation.agent_id,
                        'affiliation_removed',
                        'Affiliazione terminata',
                        `${player.first_name} ${player.last_name} ha terminato l'affiliazione con te.`,
                        { affiliationId: affiliation.id, playerId: affiliation.player_id, playerName: `${player.first_name} ${player.last_name}` }
                    )
                }
            } else if (agentId && agentId === affiliation.agent_id) {
                // Agent is removing the player -> notify the player
                const { data: agent } = await supabaseServer
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', affiliation.agent_id)
                    .single()

                if (agent) {
                    await createNotification(
                        affiliation.player_id,
                        'affiliation_removed',
                        'Affiliazione terminata',
                        `${agent.first_name} ${agent.last_name} ha terminato l'affiliazione con te.`,
                        { affiliationId: affiliation.id, agentId: affiliation.agent_id, agentName: `${agent.first_name} ${agent.last_name}` }
                    )
                }
            }
        }

        // Delete affiliation
        const { error: deleteError } = await supabaseServer
            .from('affiliations')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('Error deleting affiliation:', deleteError)
            return withCors(NextResponse.json({ error: deleteError.message }, { status: 500 }))
        }

        return withCors(NextResponse.json({ success: true, blocked: block }))
    } catch (err: any) {
        console.error('DELETE /api/affiliations error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
