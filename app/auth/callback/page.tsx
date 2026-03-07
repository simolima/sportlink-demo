"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

// Previene doppia esecuzione in React StrictMode (development)
let callbackProcessed = false

export default function AuthCallbackPage() {
    const [status, setStatus] = useState<string>('Autenticazione in corso...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (callbackProcessed) return
        callbackProcessed = true

        let mounted = true
        let authListenerUnsubscribe: (() => void) | null = null

        const handleCallback = async () => {
            try {
                const url = new URL(window.location.href)
                const authCode = url.searchParams.get('code')
                const hasHashToken = window.location.hash.includes('access_token')

                // ── STRATEGIA 1: Code exchange (PKCE flow) ──
                if (authCode) {
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

                    if (data?.session) {
                        return processSession(data.session)
                    }
                    if (exchangeError) {
                        console.warn('Code exchange error:', exchangeError.message)
                    }
                }

                // ── STRATEGIA 2: Hash token (implicit flow) ──
                // Supabase potrebbe aver già intercettato l'hash e stabilito la sessione
                if (hasHashToken) {
                    // Aspetta che Supabase processi l'hash token
                    await new Promise(r => setTimeout(r, 500))
                }

                // ── STRATEGIA 3: Sessione già presente ──
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    return processSession(session)
                }

                // ── STRATEGIA 4: Aspetta onAuthStateChange ──
                // Il token potrebbe arrivare in modo asincrono
                const sessionFromListener = await new Promise<any>((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 3000)
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
                        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                            clearTimeout(timeout)
                            resolve(session)
                        }
                    })
                    authListenerUnsubscribe = () => subscription.unsubscribe()
                })

                if (sessionFromListener) {
                    return processSession(sessionFromListener)
                }

                // ── STRATEGIA 5: Ultimo tentativo con refresh ──
                const { data: refreshData } = await supabase.auth.refreshSession()
                if (refreshData?.session) {
                    return processSession(refreshData.session)
                }

                // Nessuna sessione → login
                if (mounted) setError('Sessione non trovata. Riprova il login.')
                setTimeout(() => { window.location.href = '/login' }, 2500)
            } catch (err) {
                console.error('Callback error:', err)

                // Ultimo tentativo: anche in caso di errore, controlla se abbiamo una sessione
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) return processSession(session)
                } catch { /* ignore */ }

                if (mounted) setError('Errore durante l\'autenticazione. Riprova.')
                setTimeout(() => { window.location.href = '/login' }, 2500)
            }
        }

        async function processSession(session: { user: any }) {
            const user = session.user

            // Salva info base in localStorage
            const fullName = user.user_metadata?.full_name || ''
            const firstName = user.user_metadata?.given_name || fullName.split(' ')[0] || ''
            const lastName = user.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || ''

            localStorage.setItem('currentUserId', user.id)
            localStorage.setItem('currentUserEmail', user.email || '')
            localStorage.setItem('currentUserName', fullName || `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'User')
            if (firstName) localStorage.setItem('oauth_firstName', firstName)
            if (lastName) localStorage.setItem('oauth_lastName', lastName)

            if (mounted) setStatus('Caricamento profilo...')

            // Fetch profilo con retry
            let profile: any = null
            for (let attempt = 0; attempt < 3; attempt++) {
                if (attempt > 0) await new Promise(r => setTimeout(r, 500))
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('role_id, first_name, last_name')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    profile = data
                    break
                }
                if (profileError?.code === '42501' || profileError?.message?.includes('permission denied')) {
                    break
                }
            }

            // Salva dati profilo in localStorage
            if (profile?.first_name && profile?.last_name) {
                const isPlaceholder = profile.first_name === 'Nome' || profile.last_name === 'Cognome'
                if (!isPlaceholder) {
                    localStorage.setItem('currentUserName', `${profile.first_name} ${profile.last_name}`)
                }
            }
            if (profile?.role_id) {
                localStorage.setItem('currentUserRole', profile.role_id)
            }

            // Determina dove redirectare
            const isPlaceholderName = profile?.first_name === 'Nome' || profile?.last_name === 'Cognome'
            const hasRealName = profile?.first_name && profile?.last_name && !isPlaceholderName
            const hasRole = !!profile?.role_id

            if (hasRealName && hasRole) {
                localStorage.setItem('onboarding_complete', 'true')
                window.location.href = '/home'
                return
            }

            // Se non abbiamo profilo (RLS blocca) o altro errore → vai a home comunque
            if (!profile) {
                localStorage.setItem('onboarding_complete', 'true')
                window.location.href = '/home'
                return
            }

            if (!hasRealName) {
                window.location.href = '/complete-profile'
                return
            }
            if (!hasRole) {
                window.location.href = '/profile-setup?oauth=true'
                return
            }

            localStorage.setItem('onboarding_complete', 'true')
            window.location.href = '/home'
        }

        handleCallback()
        return () => {
            mounted = false
            authListenerUnsubscribe?.()
        }
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
