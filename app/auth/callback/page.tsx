"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('🔐 Auth Callback Page - Starting...')

                // Get the current session (Supabase handles the code exchange automatically)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                console.log('📦 Session:', session)
                console.log('❌ Session Error:', sessionError)

                if (sessionError) {
                    console.error('Session error:', sessionError)
                    setError('Errore durante l\'autenticazione')
                    setTimeout(() => router.push('/login'), 2000)
                    return
                }

                if (!session) {
                    console.log('⚠️ No session found')
                    setError('Nessuna sessione trovata')
                    setTimeout(() => router.push('/login'), 2000)
                    return
                }

                const user = session.user
                console.log('👤 User authenticated:', user.id, user.email)
                console.log('📦 User metadata:', user.user_metadata)

                // Extract name from Google OAuth metadata
                const fullName = user.user_metadata?.full_name || ''
                const firstName = user.user_metadata?.given_name || fullName.split(' ')[0] || ''
                const lastName = user.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || ''
                const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

                console.log('👤 Extracted user data:', { firstName, lastName, avatarUrl })

                // Save basic session info to localStorage
                localStorage.setItem('currentUserId', user.id)
                localStorage.setItem('currentUserEmail', user.email || '')
                localStorage.setItem('currentUserName', fullName || `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'User')

                // Save OAuth user data for profile completion
                if (firstName) localStorage.setItem('oauth_firstName', firstName)
                if (lastName) localStorage.setItem('oauth_lastName', lastName)
                if (avatarUrl) localStorage.setItem('oauth_avatarUrl', avatarUrl)

                // Check if profile is complete
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role_id, first_name, last_name')
                    .eq('id', user.id)
                    .single()

                console.log('📋 Profile:', profile, 'Error:', profileError)

                const { data: sports, error: sportsError } = await supabase
                    .from('profile_sports')
                    .select('id')
                    .eq('user_id', user.id)

                console.log('🏀 Sports query result:', {
                    sports,
                    sportsError,
                    count: sports?.length,
                    userId: user.id
                })

                // Check profile completion status
                const hasCompleteProfile = !!(profile?.first_name && profile?.last_name)
                const hasRole = !!profile?.role_id
                const hasSports = !!(sports && sports.length > 0)

                console.log('📊 Profile status:', {
                    hasCompleteProfile,
                    hasRole,
                    hasSports,
                    firstName: profile?.first_name,
                    lastName: profile?.last_name,
                    roleId: profile?.role_id,
                    sportsCount: sports?.length || 0
                })

                // Redirect to appropriate onboarding step
                if (!hasCompleteProfile) {
                    console.log('⚠️ Name missing, redirecting to complete-profile...')
                    window.location.href = '/complete-profile'
                    return
                }

                if (!hasRole) {
                    console.log('⚠️ Role missing, redirecting to profile-setup...')
                    window.location.href = '/profile-setup?oauth=true'
                    return
                }

                if (!hasSports) {
                    console.log('⚠️ Sports missing, redirecting to select-sport...')
                    window.location.href = '/select-sport'
                    return
                }

                console.log('✅ Profile complete, redirecting to home')

                // Save complete user info
                if (profile?.first_name && profile?.last_name) {
                    localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                }
                localStorage.setItem('currentUserRole', profile.role_id)

                window.location.href = '/home'

            } catch (err) {
                console.error('❌ Callback error:', err)
                setError('Errore durante il processo di autenticazione')
                setTimeout(() => router.push('/login'), 2000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                {error ? (
                    <div>
                        <p className="text-red-600 mb-2">{error}</p>
                        <p className="text-gray-600">Reindirizzamento al login...</p>
                    </div>
                ) : (
                    <p className="text-gray-600">Autenticazione in corso...</p>
                )}
            </div>
        </div>
    )
}
