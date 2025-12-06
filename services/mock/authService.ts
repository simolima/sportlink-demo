/**
 * Mock Auth Service - Autenticazione e gestione utenti
 * Gestisce login, registrazione e sessione utente
 */

import { User, UserRole } from '@/lib/types'
import { mockUsers } from './data/users'

// Simulazione sessione utente corrente
let currentUser: User | null = null

export const authService = {
    /**
     * Login utente
     */
    async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
        // Simula delay network
        await new Promise(resolve => setTimeout(resolve, 300))

        const user = mockUsers.find(u => u.email === email && u.password === password)
        if (!user) {
            return null
        }

        currentUser = user
        const token = `mock_token_${user.id}_${Date.now()}`

        // Salva in localStorage (per persistenza)
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserId', String(user.id))
            localStorage.setItem('currentUserEmail', user.email)
            localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
            localStorage.setItem('currentUserAvatar', user.avatarUrl || '')
            localStorage.setItem('authToken', token)
        }

        return { user, token }
    },

    /**
     * Registrazione nuovo utente
     */
    async register(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 400))

        const newUser: User = {
            ...userData,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            verified: false,
            coverUrl: undefined,
        }

        mockUsers.push(newUser)
        currentUser = newUser

        // Salva in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserId', String(newUser.id))
            localStorage.setItem('currentUserEmail', newUser.email)
            localStorage.setItem('currentUserName', `${newUser.firstName} ${newUser.lastName}`)
            localStorage.setItem('currentUserAvatar', newUser.avatarUrl || '')
        }

        return newUser
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        currentUser = null

        if (typeof window !== 'undefined') {
            localStorage.removeItem('currentUserId')
            localStorage.removeItem('currentUserEmail')
            localStorage.removeItem('currentUserName')
            localStorage.removeItem('currentUserAvatar')
            localStorage.removeItem('authToken')
        }
    },

    /**
     * Ottieni utente corrente
     */
    getCurrentUser(): User | null {
        return currentUser
    },

    /**
     * Verifica se è autenticato
     */
    isAuthenticated(): boolean {
        return currentUser !== null
    },

    /**
     * Ripristina sessione da localStorage
     */
    async restoreSession(): Promise<User | null> {
        if (typeof window === 'undefined') return null

        const userId = localStorage.getItem('currentUserId')
        if (!userId) return null

        const user = mockUsers.find(u => String(u.id) === userId)
        if (user) {
            currentUser = user
        }

        return user || null
    },

    /**
     * Aggiorna profilo utente
     */
    async updateProfile(userId: number | string, updates: Partial<User>): Promise<User | null> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const userIndex = mockUsers.findIndex(u => u.id === userId)
        if (userIndex === -1) return null

        mockUsers[userIndex] = {
            ...mockUsers[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        }

        if (currentUser && currentUser.id === userId) {
            currentUser = mockUsers[userIndex]
        }

        return mockUsers[userIndex]
    }
}
