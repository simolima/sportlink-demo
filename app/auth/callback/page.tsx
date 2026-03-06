"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
    const [status, setStatus] = useState<string>('Autenticazione in corso...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        const handleCallback = async () => {
            try {
                // Step 1: Exchange code for session (se presente)
                const url = new URL(window.location.href)
                const authCode = url.searchParams.get('code')

                if (authCode) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
                    // Se il code è già stato scambiato, non è un errore fatale
                    if (exchangeError) {
                        console.warn('Code exchange issue (may already be exchanged):', exchangeError.message)
                    }
                }

                // Step 2: Assicurarsi di avere la sessione
                await supabase.auth.refreshSession()
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    // Ultimo tentativo: aspetta che la sessione si propaghi
                    await new Promise(r => setTimeout(r, 500))
                    const { data: { session: retrySession } } = await supabase.auth.getSession()
                    if (!retrySession) {
                        if (mounted) setError('Sessione non trovata. Riprova il login.')
                        setTimeout(() => { window.location.href = '/login' }, 2000)
                        return
                    }
                    // Usa la sessione dal retry
                    return processSession(retrySession)
                }

                return processSession(session)
            } catch (err) {
                console.error('Callback error:', err)
                // Se abbiamo comunque una sessione valida, procedi
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                        return processSession(session)
                    }
                } catch { /* ignore */ }

                if (mounted) setError('Errore durante l\'autenticazione. Riprova.')
                setTimeout(() => { window.location.href = '/login' }, 2000)
            }
        }

        async function processSession(session: { user: any }) {
            const user = session.user

            // Salva info base in localStorage
            const fullName = user.user_metadata?.full_name || ''
            const firstName = user.user_metadata?.given_name || fullName.split(' ')[0] || ''
            const lastName = user.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || ''
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

            localStorage.setItem('currentUserId', user.id)
            localStorage.setItem('currentUserEmail', user.email || '')
            localStorage.setItem('currentUserName', fullName || `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'User')
            if (firstName) localStorage.setItem('oauth_firstName', firstName)
            if (lastName) localStorage.setItem('oauth_lastName', lastName)
            if (avatarUrl) localStorage.setItem('oauth_avatarUrl', avatarUrl)

            if (mounted) setStatus('Caricamento profilo...')

            // Step 3: Fetch profilo con retry (il trigger DB potrebbe non aver ancora creato il profilo)
            let profile: any = null
            for (let attempt = 0; attempt < 3; attempt++) {
                await new Promise(r => setTimeout(r, attempt * 500)) // 0ms, 500ms, 1000ms
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('role_id, first_name, last_name')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    profile = data
                    break
                }
                // RLS error → assume profilo esiste
                if (profileError?.code === '42501' || profileError?.message?.includes('permission denied')) {
                    break
                }
            }

            // Check profile_sports (non-blocking, nessun redirect se fallisce)
            const { data: sports, error: sportsError } = await supabase
                .from('profile_sports')
                .select('id')
                .eq('user_id', user.id)

            const isRLSError = sportsError && (
                sportsError.code === '42501' ||
                sportsError.message?.includes('row-level security') ||
                sportsError.message?.includes('permission denied')
            )

            // Salva dati profilo in localStorage se disponibili
            if (profile?.first_name && profile?.last_name) {
                const isPlaceholder = profile.first_name === 'Nome' || profile.last_name === 'Cognome'
                if (!isPlaceholder) {
                    localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                }
            }
            if (profile?.role_id) {
                localStorage.setItem('currentUserRole', profile.role_id)
            }

            // Determina dove redirect
            const isPlaceholderName = profile?.first_name === 'Nome' || profile?.last_name === 'Cognome'
            const hasRealName = profile?.first_name && profile?.last_name && !isPlaceholderName
            const hasRole = !!profile?.role_id

            // Se ha nome e ruolo → home
            if (hasRealName && hasRole) {
                localStorage.setItem('onboarding_complete', 'true')
                window.location.href = '/home'
                return
            }

            // Se RLS blocca tutto ma abbiamo una sessione → vai a home (assume profilo completo)
            if (isRLSError && !profile) {
                localStorage.setItem('onboarding_complete', 'true')
                window.location.href = '/home'
                return
            }

            // Profilo incompleto → onboarding
            if (!hasRealName) {
                window.location.href = '/complete-profile'
                return
            }
            if (!hasRole) {
                window.location.href = '/profile-setup?oauth=true'
                return
            }

            // Fallback: vai a home comunque
            localStorage.setItem('onboarding_complete', 'true')
            window.location.href = '/home'
        }

        handleCallback()
        return () => { mounted = false }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0F32' }}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
                {error ? (
                    <div>
                        <p className="text-red-400 mb-2">{error}</p>
                        <p className="text-gray-400 text-sm">Reindirizzamento...</p>
                    </div>
                ) : (
                    <p className="text-gray-300">{status}</p>
                )}
            </div>
        </div>
    )
}
