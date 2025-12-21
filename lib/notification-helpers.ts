/**
 * Shared notification creation utilities
 * Centralizes notification logic to eliminate duplication across API routes
 */

import { readNotifications, writeNotifications, readUsers } from './file-system'

/**
 * Base notification creation function
 */
export function createNotification(
    userId: string | number,
    type: string,
    title: string,
    message: string,
    metadata: any = {}
) {
    const notifications = readNotifications()
    const newNotification = {
        id: Date.now(),
        userId: String(userId),
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

/**
 * Creates a notification for a new application
 */
export function createApplicationNotification(
    applicant: any,
    opportunity: any,
    sportingDirectorId: string
) {
    const applicantName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Un candidato'
    const opportunityTitle = opportunity.title || null

    const message = opportunityTitle
        ? `${applicantName} si è candidato al tuo annuncio "${opportunityTitle}".`
        : `${applicantName} si è candidato a uno dei tuoi annunci.`

    return createNotification(
        sportingDirectorId,
        'new_application',
        'Nuova candidatura',
        message,
        {
            applicantId: applicant.id,
            applicantName,
            applicantAvatar: applicant.avatarUrl || applicant.avatar || null,
            opportunityId: opportunity.id,
            opportunityTitle
        }
    )
}

/**
 * Creates a notification for candidacy status change (accepted/rejected)
 */
export function createCandidacyStatusNotification(
    applicantId: string,
    opportunity: any,
    newStatus: 'accepted' | 'rejected',
    applicationId: string | number,
    reviewerId?: string
) {
    const opportunityTitle = opportunity?.title || null
    const type = newStatus === 'accepted' ? 'candidacy_accepted' : 'candidacy_rejected'
    const title = newStatus === 'accepted' ? 'Candidatura accettata' : 'Candidatura rifiutata'

    const message = opportunityTitle
        ? `La tua candidatura all'annuncio "${opportunityTitle}" è stata ${newStatus === 'accepted' ? 'accettata' : 'rifiutata'}.`
        : `La tua candidatura è stata ${newStatus === 'accepted' ? 'accettata' : 'rifiutata'}.`

    return createNotification(
        applicantId,
        type,
        title,
        message,
        {
            applicationId,
            opportunityId: opportunity?.id || null,
            opportunityTitle,
            reviewerId: reviewerId || null
        }
    )
}

/**
 * Creates a notification for a new follower
 */
export function createFollowNotification(followerUser: any, followedUserId: string) {
    const followerName = `${followerUser.firstName || ''} ${followerUser.lastName || ''}`.trim() || 'Un utente'

    return createNotification(
        followedUserId,
        'new_follower',
        'Nuovo follower',
        `${followerName} ha iniziato a seguirti.`,
        {
            followerId: followerUser.id,
            followerName,
            followerAvatar: followerUser.avatarUrl || followerUser.avatar || null
        }
    )
}

/**
 * Creates a notification for an affiliation request
 */
export function createAffiliationRequestNotification(
    agentId: string,
    playerId: string,
    affiliationId: number
) {
    const users = readUsers()
    const agent = users.find((u: any) => u.id.toString() === agentId.toString())
    
    if (agent) {
        return createNotification(
            playerId,
            'affiliation_request',
            'Nuova richiesta di affiliazione',
            `${agent.firstName} ${agent.lastName} ha richiesto di diventare il tuo agente.`,
            {
                affiliationId,
                agentId,
                agentName: `${agent.firstName} ${agent.lastName}`
            }
        )
    }
    return null
}

/**
 * Creates a notification for affiliation status change (accepted/rejected)
 */
export function createAffiliationStatusNotification(
    affiliation: any,
    status: 'accepted' | 'rejected'
) {
    const users = readUsers()
    const player = users.find((u: any) => u.id.toString() === affiliation.playerId.toString())
    
    if (player) {
        const notifTitle = status === 'accepted'
            ? 'Richiesta di affiliazione accettata'
            : 'Richiesta di affiliazione rifiutata'
        const notifMessage = status === 'accepted'
            ? `${player.firstName} ${player.lastName} ha accettato la tua richiesta di affiliazione.`
            : `${player.firstName} ${player.lastName} ha rifiutato la tua richiesta di affiliazione.`

        return createNotification(
            affiliation.agentId,
            status === 'accepted' ? 'affiliation_accepted' : 'affiliation_rejected',
            notifTitle,
            notifMessage,
            {
                affiliationId: affiliation.id,
                playerId: affiliation.playerId,
                playerName: `${player.firstName} ${player.lastName}`
            }
        )
    }
    return null
}

/**
 * Creates a notification for affiliation removal
 */
export function createAffiliationRemovedNotification(
    affiliation: any,
    removedByPlayerId?: string,
    removedByAgentId?: string
) {
    const users = readUsers()

    if (removedByPlayerId && removedByPlayerId.toString() === affiliation.playerId.toString()) {
        // Player is removing the agent -> notify the agent
        const player = users.find((u: any) => u.id.toString() === affiliation.playerId.toString())
        if (player) {
            return createNotification(
                affiliation.agentId,
                'affiliation_removed',
                'Affiliazione terminata',
                `${player.firstName} ${player.lastName} ha terminato l'affiliazione con te.`,
                {
                    affiliationId: affiliation.id,
                    playerId: affiliation.playerId,
                    playerName: `${player.firstName} ${player.lastName}`
                }
            )
        }
    } else if (removedByAgentId && removedByAgentId.toString() === affiliation.agentId.toString()) {
        // Agent is removing the player -> notify the player
        const agent = users.find((u: any) => u.id.toString() === affiliation.agentId.toString())
        if (agent) {
            return createNotification(
                affiliation.playerId,
                'affiliation_removed',
                'Affiliazione terminata',
                `${agent.firstName} ${agent.lastName} ha terminato l'affiliazione con te.`,
                {
                    affiliationId: affiliation.id,
                    agentId: affiliation.agentId,
                    agentName: `${agent.firstName} ${agent.lastName}`
                }
            )
        }
    }
    return null
}

/**
 * Normalizes user ID to string format
 */
export function normalizeId(id: any): string {
    return String(id)
}
