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

                // Force session refresh to ensure we have the latest auth state
                await supabase.auth.refreshSession()

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

                // Small delay to ensure session is fully propagated to RLS context
                await new Promise(resolve => setTimeout(resolve, 100))

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
                    sportsErrorDetails: sportsError ? {
                        message: sportsError.message,
                        code: sportsError.code,
                        details: sportsError.details,
                        hint: sportsError.hint
                    } : null,
                    count: sports?.length,
                    userId: user.id
                })

                // If there's an RLS error, it means sports table is blocked but might have data
                // Don't redirect to select-sport if there's an RLS/permission error
                const isRLSError = sportsError && (
                    sportsError.code === '42501' || // insufficient_privilege
                    sportsError.message?.includes('row-level security') ||
                    sportsError.message?.includes('permission denied')
                )

                if (isRLSError) {
                    console.warn('⚠️ RLS blocking profile_sports query - assuming sports are saved')
                    console.log('✅ Profile appears complete (RLS blocking check), redirecting to home')

                    if (profile?.first_name && profile?.last_name) {
                        localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                    }
                    if (profile?.role_id) {
                        localStorage.setItem('currentUserRole', profile.role_id)
                    }
                    localStorage.setItem('onboarding_complete', 'true') // Set flag

                    window.location.href = '/home'
                    return
                }

                // Check profile completion status
                // Note: Trigger creates profile with "Nome", "Cognome" as placeholders
                const isPlaceholderName = profile?.first_name === 'Nome' || profile?.last_name === 'Cognome'
                const hasRealName = profile?.first_name && profile?.last_name && !isPlaceholderName

                const hasCompleteProfile = !!hasRealName
                const hasRole = !!profile?.role_id
                const hasSports = !!(sports && sports.length > 0)

                // Check if user has already completed onboarding (flag set after select-sport)
                const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true'

                console.log('📊 Profile status:', {
                    hasCompleteProfile,
                    hasRole,
                    hasSports,
                    onboardingComplete,
                    firstName: profile?.first_name,
                    lastName: profile?.last_name,
                    isPlaceholderName,
                    roleId: profile?.role_id,
                    sportsCount: sports?.length || 0,
                    // Additional check: if no sports but no error, might be cache issue
                    sportsQuerySuccessful: !sportsError,
                    possibleCacheIssue: !hasSports && !sportsError && hasCompleteProfile && hasRole
                })

                // CRITICAL FIX: If profile has real name + role, consider it complete regardless of sports/flag
                // This prevents infinite redirect loops for existing users
                if (hasCompleteProfile && hasRole) {
                    console.log('✅ Profile has name + role, considering complete and redirecting to home')
                    if (profile?.first_name && profile?.last_name) {
                        localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                    }
                    localStorage.setItem('currentUserRole', profile.role_id)
                    localStorage.setItem('onboarding_complete', 'true') // Always set flag
                    window.location.href = '/home'
                    return
                }

                // If we reach here, profile is incomplete - redirect to appropriate onboarding step
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

                // Sports are optional - if we have name + role but reached here, redirect to select-sport
                console.log('⚠️ Sports missing, redirecting to select-sport...')
                window.location.href = '/select-sport'

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
