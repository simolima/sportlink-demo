/**
 * Mock Agent Service - Gestione affiliazioni agenti-giocatori
 * CRUD completo per affiliazioni e blocchi
 */

import { Affiliation, AffiliationStatus, BlockedAgent } from '@/lib/types'
import { mockAffiliations } from './data/affiliations'

// Storage in memoria
let affiliations: Affiliation[] = [...mockAffiliations]
let blockedAgents: BlockedAgent[] = []

export const agentService = {
    /**
     * Ottieni tutte le affiliazioni
     */
    async getAll(): Promise<Affiliation[]> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return [...affiliations]
    },

    /**
     * Ottieni affiliazione per ID
     */
    async getById(id: number | string): Promise<Affiliation | null> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return affiliations.find(a => a.id === id) || null
    },

    /**
     * Ottieni affiliazioni di un agente
     */
    async getAgentAffiliations(agentId: number | string, status?: AffiliationStatus): Promise<Affiliation[]> {
        await new Promise(resolve => setTimeout(resolve, 200))

        let result = affiliations.filter(a => a.agentId === agentId)

        if (status) {
            result = result.filter(a => a.status === status)
        }

        return result
    },

    /**
     * Ottieni affiliazioni di un giocatore
     */
    async getPlayerAffiliations(playerId: number | string, status?: AffiliationStatus): Promise<Affiliation[]> {
        await new Promise(resolve => setTimeout(resolve, 200))

        let result = affiliations.filter(a => a.playerId === playerId)

        if (status) {
            result = result.filter(a => a.status === status)
        }

        return result
    },

    /**
     * Conta giocatori affiliati per un agente
     */
    async countAffiliatedPlayers(agentId: number | string): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 100))
        return affiliations.filter(a => a.agentId === agentId && a.status === 'accepted').length
    },

    /**
     * Verifica se esiste già una richiesta
     */
    async checkExistingAffiliation(agentId: number | string, playerId: number | string): Promise<Affiliation | null> {
        await new Promise(resolve => setTimeout(resolve, 100))
        return affiliations.find(a => a.agentId === agentId && a.playerId === playerId) || null
    },

    /**
     * Crea richiesta di affiliazione
     */
    async createAffiliationRequest(
        agentId: number | string,
        playerId: number | string,
        message?: string
    ): Promise<Affiliation> {
        await new Promise(resolve => setTimeout(resolve, 250))

        // Verifica se il giocatore ha bloccato l'agente
        const isBlocked = blockedAgents.some(b => b.playerId === playerId && b.agentId === agentId)
        if (isBlocked) {
            throw new Error('Agent is blocked by this player')
        }

        // Verifica se esiste già una richiesta
        const existing = await this.checkExistingAffiliation(agentId, playerId)
        if (existing) {
            throw new Error('Affiliation request already exists')
        }

        const newAffiliation: Affiliation = {
            id: Date.now(),
            agentId,
            playerId,
            status: 'pending',
            message,
            requestedAt: new Date().toISOString()
        }

        affiliations.push(newAffiliation)
        return newAffiliation
    },

    /**
     * Accetta richiesta di affiliazione
     */
    async acceptAffiliation(affiliationId: number | string, notes?: string): Promise<Affiliation | null> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const affiliation = affiliations.find(a => a.id === affiliationId)
        if (!affiliation) return null

        if (affiliation.status !== 'pending') {
            throw new Error('Affiliation is not pending')
        }

        affiliation.status = 'accepted'
        affiliation.respondedAt = new Date().toISOString()
        affiliation.affiliatedAt = new Date().toISOString()
        if (notes) {
            affiliation.notes = notes
        }

        return affiliation
    },

    /**
     * Rifiuta richiesta di affiliazione
     */
    async rejectAffiliation(affiliationId: number | string): Promise<Affiliation | null> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const affiliation = affiliations.find(a => a.id === affiliationId)
        if (!affiliation) return null

        if (affiliation.status !== 'pending') {
            throw new Error('Affiliation is not pending')
        }

        affiliation.status = 'rejected'
        affiliation.respondedAt = new Date().toISOString()

        return affiliation
    },

    /**
     * Termina affiliazione
     */
    async terminateAffiliation(affiliationId: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const index = affiliations.findIndex(a => a.id === affiliationId)
        if (index === -1) return false

        // Invece di eliminare, cambia lo stato
        affiliations.splice(index, 1)

        return true
    },

    // ========== BLOCKED AGENTS ==========

    /**
     * Ottieni agenti bloccati da un giocatore
     */
    async getBlockedAgents(playerId: number | string): Promise<BlockedAgent[]> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return blockedAgents.filter(b => b.playerId === playerId)
    },

    /**
     * Verifica se un agente è bloccato
     */
    async isAgentBlocked(playerId: number | string, agentId: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 100))
        return blockedAgents.some(b => b.playerId === playerId && b.agentId === agentId)
    },

    /**
     * Blocca un agente
     */
    async blockAgent(playerId: number | string, agentId: number | string, reason?: string): Promise<BlockedAgent> {
        await new Promise(resolve => setTimeout(resolve, 200))

        // Verifica se già bloccato
        const existing = blockedAgents.find(b => b.playerId === playerId && b.agentId === agentId)
        if (existing) {
            throw new Error('Agent is already blocked')
        }

        const blocked: BlockedAgent = {
            id: Date.now(),
            playerId,
            agentId,
            blockedAt: new Date().toISOString(),
            reason
        }

        blockedAgents.push(blocked)

        // Rimuovi eventuali affiliazioni pending
        affiliations = affiliations.filter(
            a => !(a.playerId === playerId && a.agentId === agentId && a.status === 'pending')
        )

        return blocked
    },

    /**
     * Sblocca un agente
     */
    async unblockAgent(playerId: number | string, agentId: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const index = blockedAgents.findIndex(b => b.playerId === playerId && b.agentId === agentId)
        if (index === -1) return false

        blockedAgents.splice(index, 1)
        return true
    }
}
