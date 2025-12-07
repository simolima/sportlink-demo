/**
 * useAuth Hook - Gestione autenticazione
 * Fornisce stato auth e metodi per login/logout/register
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
// import { authService } from '@/services/mock'
import type { User } from '@/lib/types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    hasCompletedProfile: boolean
    login: (email: string, password: string) => Promise<boolean>
    register: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User | null>
    logout: () => Promise<void>
    updateUser: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Ripristina sessione all'avvio
    useEffect(() => {
        // Ripristina sessione da localStorage
        const id = localStorage.getItem('currentUserId')
        const email = localStorage.getItem('currentUserEmail')
        const name = localStorage.getItem('currentUserName')
        const sport = localStorage.getItem('currentUserSport')
        const professionalRole = localStorage.getItem('currentUserRole')
        if (id && email) {
            setUser({
                id,
                email,
                firstName: name?.split(' ')[0] ?? '',
                lastName: name?.split(' ')[1] ?? '',
                sport: (sport as any) || 'Altro',
                professionalRole: (professionalRole as any) || 'Player',
                verified: false,
                password: '',
                birthDate: '',
                createdAt: '',
            })
        }
        setIsLoading(false)
    }, [])

    // Verifica se il profilo è completo (sport + role obbligatori)
    const hasCompletedProfile = !!(
        user?.sport &&
        user?.professionalRole
    )

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch('/api/users', { method: 'GET' })
            const users: User[] = await res.json()
            const user = users.find(u => u.email === email && u.password === password)
            if (user) {
                setUser(user)
                localStorage.setItem('currentUserId', String(user.id))
                localStorage.setItem('currentUserEmail', user.email)
                localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
                localStorage.setItem('currentUserAvatar', user.avatarUrl || '')
                localStorage.setItem('currentUserSport', user.sport || '')
                localStorage.setItem('currentUserRole', user.professionalRole || '')
                return true
            }
            return false
        } catch (error) {
            console.error('Login failed:', error)
            return false
        }
    }

    const register = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User | null> => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })
            if (!res.ok) return null
            const newUser = await res.json()
            setUser(newUser)
            localStorage.setItem('currentUserId', String(newUser.id))
            localStorage.setItem('currentUserEmail', newUser.email)
            localStorage.setItem('currentUserName', `${newUser.firstName} ${newUser.lastName}`)
            localStorage.setItem('currentUserAvatar', newUser.avatarUrl || '')
            localStorage.setItem('currentUserSport', newUser.sport || '')
            localStorage.setItem('currentUserRole', newUser.professionalRole || '')
            return newUser
        } catch (error) {
            console.error('Registration failed:', error)
            return null
        }
    }

    const logout = async () => {
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserEmail')
        localStorage.removeItem('currentUserName')
        localStorage.removeItem('currentUserAvatar')
        localStorage.removeItem('currentUserSport')
        localStorage.removeItem('currentUserRole')
        setUser(null)
        router.push('/login')
    }

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, ...updates })
            })
            if (!res.ok) return
            const updated = await res.json()
            setUser(updated)
        } catch (error) {
            console.error('Failed to update user:', error)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                hasCompletedProfile,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

/**
 * Hook per proteggere le pagine - richiede autenticazione
 */
export function useRequireAuth(requireProfileSetup: boolean = true) {
    const { user, isLoading, hasCompletedProfile } = useAuth()
    const router = useRouter()
    const [didRedirect, setDidRedirect] = useState(false)

    useEffect(() => {
        if (isLoading || didRedirect) return

        // Non autenticato -> redirect a login
        if (!user) {
            setDidRedirect(true)
            router.push('/login')
            return
        }

        // Autenticato ma profilo incompleto -> redirect a profile setup
        if (requireProfileSetup && !hasCompletedProfile) {
            setDidRedirect(true)
            router.push('/profile-setup')
            return
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading, hasCompletedProfile, requireProfileSetup])

    return { user, isLoading, isAuthenticated: !!user, hasCompletedProfile }
}
