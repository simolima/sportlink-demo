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
    loginWithGoogle: () => Promise<void>
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
        const sportsJson = localStorage.getItem('currentUserSports')
        const sport = localStorage.getItem('currentUserSport')
        const professionalRole = localStorage.getItem('currentUserRole')
        if (id && email) {
            const sports = sportsJson ? JSON.parse(sportsJson) : (sport ? [sport] : [])
            setUser({
                id,
                email,
                firstName: name?.split(' ')[0] ?? '',
                lastName: name?.split(' ')[1] ?? '',
                sports: sports,
                professionalRole: (professionalRole as any) || '', // Don't use fallback 'Player'
                verified: false,
                password: '',
                birthDate: '',
                createdAt: '',
            } as any)
        }
        setIsLoading(false)
    }, [])

    // Verifica se il profilo è completo (sports + role obbligatori)
    const hasCompletedProfile = !!(
        user?.sports && user.sports.length > 0 &&
        user?.professionalRole
    )

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            console.log('🔐 Login attempt for:', email)

            // Import Supabase client dynamically
            const { supabase } = await import('@/lib/supabase-browser')

            // Step 1: Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            console.log('🔐 Supabase Auth response:', {
                hasUser: !!authData?.user,
                error: authError?.message,
                errorCode: authError?.code
            })

            if (authError || !authData.user) {
                console.error('❌ Supabase login error:', authError)

                // Surface configuration errors clearly (instead of generic invalid credentials)
                if (authError?.message?.toLowerCase().includes('invalid api key')) {
                    throw new Error('Configurazione Supabase non valida (chiave API errata).')
                }

                return false
            }

            console.log('✅ Auth successful, user ID:', authData.user.id)

            // Step 2: Get user profile from profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (profileError || !profile) {
                console.error('Profile fetch error:', profileError)
                return false
            }

            // Step 3: Get user's sports from profile_sports
            const { data: userSports, error: sportsError } = await supabase
                .from('profile_sports')
                .select('sport_id, is_main_sport, lookup_sports(name)')
                .eq('user_id', authData.user.id)

            const sports = userSports?.map((ps: any) => ps.lookup_sports?.name).filter(Boolean) || []

            // Step 4: Determina il ruolo attivo.
            // Leggiamo direttamente da profile_roles via browser client
            // (il cookie di sessione potrebbe non essere ancora sincronizzato col server).
            let activeRole: string = profile.role_id || ''
            try {
                const { data: primaryRole } = await supabase
                    .from('profile_roles')
                    .select('role_id')
                    .eq('user_id', authData.user.id)
                    .eq('is_active', true)
                    .eq('is_primary', true)
                    .maybeSingle()
                if (primaryRole?.role_id) {
                    activeRole = primaryRole.role_id
                } else {
                    // Fallback: primo ruolo attivo
                    const { data: anyRole } = await supabase
                        .from('profile_roles')
                        .select('role_id')
                        .eq('user_id', authData.user.id)
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle()
                    if (anyRole?.role_id) activeRole = anyRole.role_id
                }
            } catch {
                // Se profile_roles non è accessibile, usa profile.role_id (già assegnato)
            }

            // Persisti il ruolo nel cookie server-side (best-effort)
            try {
                const { switchActiveRole } = await import('@/app/actions/role-actions')
                await switchActiveRole(activeRole as any)
            } catch {
                // Se il cookie non viene impostato ora, verrà impostato al prossimo getActiveRole()
            }

            // Construct user object
            const user: User = {
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                sports: sports,
                professionalRole: activeRole || 'player',
                verified: false,
                password: '',
                birthDate: profile.birth_date || '',
                avatarUrl: profile.avatar_url || '',
                createdAt: profile.created_at,
            } as any

            setUser(user)
            localStorage.setItem('currentUserId', String(user.id))
            localStorage.setItem('currentUserEmail', user.email)
            localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
            localStorage.setItem('currentUserAvatar', user.avatarUrl || '')
            localStorage.setItem('currentUserSports', JSON.stringify(sports))
            localStorage.setItem('currentUserSport', sports[0] || '')
            localStorage.setItem('currentUserRole', user.professionalRole || '')

            return true
        } catch (error) {
            console.error('Login failed:', error)
            if (error instanceof Error) {
                throw error
            }
            return false
        }
    }

    const loginWithGoogle = async () => {
        try {
            const { supabase } = await import('@/lib/supabase-browser')

            const redirectUrl = `${window.location.origin}/auth/callback`
            console.log('🔵 Starting Google OAuth...')
            console.log('🔗 Redirect URL:', redirectUrl)

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account',   // Forza la selezione dell'account Google
                    },
                    skipBrowserRedirect: false,     // Assicura redirect immediato
                }
            })

            console.log('📤 OAuth response:', { data, error })

            if (error) {
                console.error('❌ Google login error:', error)
                throw error
            }

            // Se signInWithOAuth non ha fatto redirect automatico, forziamo noi
            if (data?.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('❌ Google login failed:', error)
            throw error
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
            // Supporta sia sports (array) che sport (legacy)
            const userSports = (newUser as any).sports || []
            localStorage.setItem('currentUserSports', JSON.stringify(userSports))
            localStorage.setItem('currentUserSport', userSports[0] || (newUser as any).sport || '')
            localStorage.setItem('currentUserRole', newUser.professionalRole || '')
            return newUser
        } catch (error) {
            console.error('Registration failed:', error)
            return null
        }
    }

    const logout = async () => {
        // Cancella cookie server-side
        try {
            const { clearActiveRole } = await import('@/app/actions/role-actions')
            await clearActiveRole()
        } catch { /* ignore */ }
        // Cancella Supabase session
        try {
            const { supabase } = await import('@/lib/supabase-browser')
            await supabase.auth.signOut()
        } catch { /* ignore */ }
        // Pulisci tutto localStorage
        const keys = [
            'currentUserId', 'currentUserName', 'currentUserEmail',
            'currentUserAvatar', 'currentUserRole', 'currentUserSport',
            'currentUserSports', 'onboarding_complete', 'selectedClubId',
        ]
        keys.forEach(k => localStorage.removeItem(k))
        setUser(null)
        window.location.href = '/login'
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
                loginWithGoogle,
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

        // Autenticato ma profilo incompleto (no sports) -> redirect a complete-profile
        if (requireProfileSetup && user.professionalRole && (!user.sports || user.sports.length === 0)) {
            setDidRedirect(true)
            router.push('/complete-profile')
            return
        }

        // Autenticato ma profilo incompleto (altre validazioni) -> redirect a profile-setup
        if (requireProfileSetup && !hasCompletedProfile) {
            setDidRedirect(true)
            router.push('/profile-setup')
            return
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading, hasCompletedProfile, requireProfileSetup])

    return { user, isLoading, isAuthenticated: !!user, hasCompletedProfile }
}
