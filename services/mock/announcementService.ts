/**
 * Mock Announcement Service - Gestione annunci
 * CRUD completo per annunci e candidature
 */

import { Announcement, Application, ApplicationStatus } from '@/lib/types'
import { mockAnnouncements } from './data/announcements'

// Storage in memoria
let announcements: Announcement[] = [...mockAnnouncements]
let applications: Application[] = []

export const announcementService = {
    /**
     * Ottieni tutti gli annunci attivi
     */
    async getAll(activeOnly: boolean = true): Promise<Announcement[]> {
        await new Promise(resolve => setTimeout(resolve, 200))

        if (activeOnly) {
            return announcements.filter(a => a.isActive)
        }
        return [...announcements]
    },

    /**
     * Ottieni annuncio per ID
     */
    async getById(id: number | string): Promise<Announcement | null> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return announcements.find(a => a.id === id) || null
    },

    /**
     * Ottieni annunci per club
     */
    async getByClubId(clubId: number | string): Promise<Announcement[]> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return announcements.filter(a => a.clubId === clubId && a.isActive)
    },

    /**
     * Filtra annunci
     */
    async filter(params: {
        sport?: string
        type?: string
        city?: string
        level?: string
    }): Promise<Announcement[]> {
        await new Promise(resolve => setTimeout(resolve, 250))

        let result = announcements.filter(a => a.isActive)

        if (params.sport) {
            result = result.filter(a => a.sport === params.sport)
        }
        if (params.type) {
            result = result.filter(a => a.type === params.type)
        }
        if (params.city) {
            result = result.filter(a => a.city?.toLowerCase().includes(params.city!.toLowerCase()))
        }
        if (params.level) {
            result = result.filter(a => a.level === params.level)
        }

        return result
    },

    /**
     * Crea nuovo annuncio
     */
    async create(announcementData: Omit<Announcement, 'id' | 'createdAt' | 'isActive'>): Promise<Announcement> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const newAnnouncement: Announcement = {
            ...announcementData,
            id: Date.now(),
            isActive: true,
            createdAt: new Date().toISOString()
        }

        announcements.push(newAnnouncement)
        return newAnnouncement
    },

    /**
     * Aggiorna annuncio
     */
    async update(id: number | string, updates: Partial<Announcement>): Promise<Announcement | null> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const index = announcements.findIndex(a => a.id === id)
        if (index === -1) return null

        announcements[index] = {
            ...announcements[index],
            ...updates,
            id: announcements[index].id, // Non modificabile
            createdAt: announcements[index].createdAt, // Non modificabile
            clubId: announcements[index].clubId, // Non modificabile
            createdBy: announcements[index].createdBy, // Non modificabile
            updatedAt: new Date().toISOString()
        }

        return announcements[index]
    },

    /**
     * Disattiva annuncio
     */
    async deactivate(id: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const announcement = announcements.find(a => a.id === id)
        if (!announcement) return false

        announcement.isActive = false
        announcement.updatedAt = new Date().toISOString()

        return true
    },

    /**
     * Elimina annuncio
     */
    async delete(id: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const index = announcements.findIndex(a => a.id === id)
        if (index === -1) return false

        announcements.splice(index, 1)
        // Rimuovi anche le applicazioni associate
        applications = applications.filter(app => app.announcementId !== id)

        return true
    },

    // ========== APPLICATIONS ==========

    /**
     * Ottieni candidature per un annuncio
     */
    async getApplications(announcementId: number | string, status?: ApplicationStatus): Promise<Application[]> {
        await new Promise(resolve => setTimeout(resolve, 150))

        let result = applications.filter(app => app.announcementId === announcementId)

        if (status) {
            result = result.filter(app => app.status === status)
        }

        return result
    },

    /**
     * Ottieni candidature di un giocatore
     */
    async getPlayerApplications(playerId: number | string): Promise<Application[]> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return applications.filter(app => app.playerId === playerId)
    },

    /**
     * Ottieni candidature di un agente
     */
    async getAgentApplications(agentId: number | string): Promise<Application[]> {
        await new Promise(resolve => setTimeout(resolve, 150))
        return applications.filter(app => app.agentId === agentId)
    },

    /**
     * Crea nuova candidatura
     */
    async createApplication(
        announcementId: number | string,
        playerId: number | string,
        agentId?: number | string,
        message?: string
    ): Promise<Application> {
        await new Promise(resolve => setTimeout(resolve, 250))

        // Verifica se esiste già una candidatura
        const existing = applications.find(
            app => app.announcementId === announcementId && app.playerId === playerId
        )

        if (existing) {
            throw new Error('Application already exists')
        }

        const newApplication: Application = {
            id: Date.now(),
            announcementId,
            playerId,
            agentId,
            status: 'pending',
            message,
            appliedAt: new Date().toISOString()
        }

        applications.push(newApplication)
        return newApplication
    },

    /**
     * Aggiorna stato candidatura
     */
    async updateApplicationStatus(
        applicationId: number | string,
        status: ApplicationStatus,
        reviewedBy?: number | string
    ): Promise<Application | null> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const application = applications.find(app => app.id === applicationId)
        if (!application) return null

        application.status = status
        application.updatedAt = new Date().toISOString()
        if (reviewedBy) {
            application.reviewedBy = reviewedBy
        }

        return application
    },

    /**
     * Ritira candidatura
     */
    async withdrawApplication(applicationId: number | string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200))

        const application = applications.find(app => app.id === applicationId)
        if (!application) return false

        application.status = 'withdrawn'
        application.updatedAt = new Date().toISOString()

        return true
    },

    /**
     * Conta candidature per annuncio
     */
    async countApplications(announcementId: number | string): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 100))
        return applications.filter(app => app.announcementId === announcementId).length
    }
}
