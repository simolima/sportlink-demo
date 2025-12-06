/**
 * Mock Club Service - Gestione club
 * CRUD completo per club e membership
 */

import { Club, ClubMembership, ClubJoinRequest, ClubRole, ClubPermission } from '@/lib/types'
import { mockClubs } from './data/clubs'

// Storage in memoria
let clubs: Club[] = [...mockClubs]
let memberships: ClubMembership[] = []
let joinRequests: ClubJoinRequest[] = []

export const clubService = {
    /**
     * Ottieni tutti i club
     */
    async getAll(): Promise<Club[]> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return [...clubs]
    },

    /**
     * Ottieni club per ID
     */
    async getById(id: number | string): Promise<Club | null> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return clubs.find(c => c.id === id) || null
    },

    /**
     * Cerca club per sport
     */
    async getBySport(sport: string): Promise<Club[]> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return clubs.filter(c => c.sports.includes(sport as any))
    },

    /**
     * Cerca club per città
     */
    async getByCity(city: string): Promise<Club[]> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return clubs.filter(c => c.city.toLowerCase().includes(city.toLowerCase()))
    },

    /**
     * Crea nuovo club
     */
    async create(clubData: Omit<Club, 'id' | 'createdAt' | 'followersCount' | 'membersCount'>): Promise<Club> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const newClub: Club = {
            ...clubData,
            id: Date.now(),
            followersCount: 0,
            membersCount: 1, // Il creatore è automaticamente membro
            createdAt: new Date().toISOString()
        }

        clubs.push(newClub)

        // Crea automaticamente membership per il creatore come Admin
        const creatorMembership: ClubMembership = {
            id: Date.now() + 1,
            clubId: newClub.id,
            userId: clubData.createdBy,
            role: 'Admin',
            permissions: ['create_announcements', 'manage_applications', 'manage_members', 'edit_club_info'],
            joinedAt: new Date().toISOString(),
            isActive: true
        }

        memberships.push(creatorMembership)

        return newClub
    },

    /**
     * Aggiorna club
     */
    async update(id: number | string, updates: Partial<Club>): Promise<Club | null> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const index = clubs.findIndex(c => c.id === id)
        if (index === -1) return null

        clubs[index] = {
            ...clubs[index],
            ...updates,
            id: clubs[index].id, // Non modificabile
            createdAt: clubs[index].createdAt, // Non modificabile
            createdBy: clubs[index].createdBy // Non modificabile
        }

        return clubs[index]
    },

    /**
     * Elimina club (soft delete - imposta isActive = false se implementato)
     */
    async delete(id: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const index = clubs.findIndex(c => c.id === id)
        if (index === -1) return false

        clubs.splice(index, 1)
        // Rimuovi anche le membership associate
        memberships = memberships.filter(m => m.clubId !== id)

        return true
    },

    /**
     * Incrementa contatore followers
     */
    async incrementFollowers(clubId: number | string): Promise<void> {
        const club = clubs.find(c => c.id === clubId)
        if (club) {
            club.followersCount++
        }
    },

    /**
     * Decrementa contatore followers
     */
    async decrementFollowers(clubId: number | string): Promise<void> {
        const club = clubs.find(c => c.id === clubId)
        if (club && club.followersCount > 0) {
            club.followersCount--
        }
    },

    // ========== CLUB MEMBERSHIP ==========

    /**
     * Ottieni membri di un club
     */
    async getMembers(clubId: number | string): Promise<ClubMembership[]> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return memberships.filter(m => m.clubId === clubId && m.isActive)
    },

    /**
     * Aggiungi membro al club
     */
    async addMember(
        clubId: number | string,
        userId: number | string,
        role: ClubRole,
        permissions: ClubPermission[] = []
    ): Promise<ClubMembership> {
        await new Promise(resolve => setTimeout(resolve, 250))

        const newMembership: ClubMembership = {
            id: Date.now(),
            clubId,
            userId,
            role,
            permissions,
            joinedAt: new Date().toISOString(),
            isActive: true
        }

        memberships.push(newMembership)

        // Aggiorna contatore membri del club
        const club = clubs.find(c => c.id === clubId)
        if (club) {
            club.membersCount++
        }

        return newMembership
    },

    /**
     * Rimuovi membro dal club
     */
    async removeMember(clubId: number | string, userId: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const index = memberships.findIndex(m => m.clubId === clubId && m.userId === userId)
        if (index === -1) return false

        memberships[index].isActive = false

        // Aggiorna contatore membri del club
        const club = clubs.find(c => c.id === clubId)
        if (club && club.membersCount > 0) {
            club.membersCount--
        }

        return true
    },

    /**
     * Aggiorna ruolo/permessi membro
     */
    async updateMemberRole(
        clubId: number | string,
        userId: number | string,
        role?: ClubRole,
        permissions?: ClubPermission[]
    ): Promise<ClubMembership | null> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const membership = memberships.find(m => m.clubId === clubId && m.userId === userId && m.isActive)
        if (!membership) return null

        if (role) membership.role = role
        if (permissions) membership.permissions = permissions

        return membership
    },

    // ========== CLUB JOIN REQUESTS ==========

    /**
     * Ottieni richieste di ingresso per un club
     */
    async getJoinRequests(clubId: number | string, status?: 'pending' | 'accepted' | 'rejected'): Promise<ClubJoinRequest[]> {
        await new Promise(resolve => setTimeout(resolve, 150))

        let requests = joinRequests.filter(r => r.clubId === clubId)
        if (status) {
            requests = requests.filter(r => r.status === status)
        }

        return requests
    },

    /**
     * Crea richiesta di ingresso
     */
    async createJoinRequest(
        clubId: number | string,
        userId: number | string,
        requestedRole: ClubRole,
        message?: string
    ): Promise<ClubJoinRequest> {
        await new Promise(resolve => setTimeout(resolve, 250))

        const newRequest: ClubJoinRequest = {
            id: Date.now(),
            clubId,
            userId,
            requestedRole,
            message,
            status: 'pending',
            requestedAt: new Date().toISOString()
        }

        joinRequests.push(newRequest)
        return newRequest
    },

    /**
     * Accetta/Rifiuta richiesta di ingresso
     */
    async respondToJoinRequest(
        requestId: number | string,
        accept: boolean,
        respondedBy: number | string
    ): Promise<ClubJoinRequest | null> {
        await new Promise(resolve => setTimeout(resolve, 250))

        const request = joinRequests.find(r => r.id === requestId)
        if (!request) return null

        request.status = accept ? 'accepted' : 'rejected'
        request.respondedAt = new Date().toISOString()
        request.respondedBy = respondedBy

        // Se accettata, crea la membership
        if (accept) {
            await this.addMember(request.clubId, request.userId, request.requestedRole)
        }

        return request
    }
}
