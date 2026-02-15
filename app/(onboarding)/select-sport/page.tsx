"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_SPORTS, isMultiSportRole, mapRoleToDatabase } from '@/utils/roleHelpers'
import { ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { createUser } from '@/lib/services/auth-service'
import { setCurrentUserSession, clearSignupDraft } from '@/lib/services/session'

export default function SelectSportPage() {
    const router = useRouter()
    const [selectedSports, setSelectedSports] = useState<string[]>([])
    const [role, setRole] = useState<ProfessionalRole | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || checked) return;
        setChecked(true)

        // Get data from localStorage
        const firstName = localStorage.getItem('signup_firstName')
        const lastName = localStorage.getItem('signup_lastName')
        const email = localStorage.getItem('signup_email')
        const password = localStorage.getItem('signup_password')
        const birthDate = localStorage.getItem('signup_birthDate')
        const currentUserRole = localStorage.getItem('currentUserRole') as ProfessionalRole | null
        const currentUserId = localStorage.getItem('currentUserId')

        console.log('🔍 Select Sport - Checking data:', {
            hasSignupData: !!(firstName && lastName && email && password && birthDate),
            hasOAuthData: !!currentUserId,
            currentUserRole
        })

        // Check if this is OAuth flow (has userId but no signup data)
        const isOAuthFlow = currentUserId && (!firstName || !email || !password)

        if (isOAuthFlow) {
            console.log('🔐 OAuth flow detected in select-sport')
            // OAuth flow - only need role and userId
            if (!currentUserRole) {
                console.log('❌ No role, redirecting to profile-setup')
                router.replace('/profile-setup?oauth=true')
                return
            }
            // Has role, can proceed with sport selection
            setRole(currentUserRole)
            return
        }

        // Regular signup flow - check all required fields
        if (!firstName || !lastName || !email || !password || !birthDate || !currentUserRole) {
            console.log('❌ Missing signup data, cleaning up and redirecting')
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserRole')
            if (currentUserId) {
                router.replace('/home')
            } else {
                router.replace('/signup')
            }
            return
        }

        setRole(currentUserRole)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked])

    const handleSelectSport = (sport: string) => {
        if (role && isMultiSportRole(role)) {
            setSelectedSports((prev) => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
        } else {
            setSelectedSports([sport])
        }
    }

    const handleConfirm = async () => {
        // Prevenzione doppio submit
        if (isLoading) return

        setIsLoading(true)
        setError(null)

        if (!role) {
            setError('Ruolo professionale mancante. Torna indietro e riprova.')
            setIsLoading(false)
            return
        }

        try {
            // Salva gli sport in localStorage
            localStorage.setItem('currentUserSports', JSON.stringify(selectedSports))

            const signupFirstName = localStorage.getItem('signup_firstName')
            const signupEmail = localStorage.getItem('signup_email')
            const signupPassword = localStorage.getItem('signup_password')
            const currentUserId = localStorage.getItem('currentUserId')
            const professionalRole = role as ProfessionalRole
            const sports = selectedSports

            // Detect true OAuth flow (avoid stale currentUserId from old sessions)
            const isOAuthFlow = !!(currentUserId && (!signupFirstName || !signupEmail || !signupPassword))

            // Check if this is OAuth flow (user already authenticated)
            if (isOAuthFlow) {
                // OAuth flow - update existing profile
                console.log('🔄 Updating OAuth user profile...')

                const { supabase } = await import('@/lib/supabase-browser')

                // Get OAuth user data from localStorage
                const firstName = localStorage.getItem('oauth_firstName') || ''
                const lastName = localStorage.getItem('oauth_lastName') || ''
                const birthDate = localStorage.getItem('oauth_birthDate') || ''
                const email = localStorage.getItem('currentUserEmail') || ''
                const avatarUrl = localStorage.getItem('oauth_avatarUrl') || ''

                console.log('📝 OAuth user data:', { firstName, lastName, birthDate, email, avatarUrl })

                // Validate required fields
                if (!firstName || !lastName) {
                    console.error('❌ Missing name data for OAuth user')
                    setError('Nome e cognome mancanti. Torna indietro e completa il profilo.')
                    setIsLoading(false)
                    return
                }

                // Update profile with complete data
                const profileUpdate: any = {
                    role_id: mapRoleToDatabase(professionalRole),
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                }

                // Add birth_date if provided
                if (birthDate) {
                    profileUpdate.birth_date = birthDate
                }

                if (avatarUrl) {
                    profileUpdate.avatar_url = avatarUrl
                }

                // Ensure profile row exists (some projects may miss auth trigger)
                const { data: existingProfile, error: existingProfileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', currentUserId)
                    .maybeSingle()

                if (existingProfileError) {
                    console.error('❌ Error checking existing profile:', existingProfileError)
                    throw new Error('Errore verifica profilo esistente')
                }

                if (!existingProfile) {
                    console.warn('⚠️ Profile row missing, creating it now...')
                    const { error: insertProfileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: currentUserId,
                            email,
                            first_name: firstName,
                            last_name: lastName,
                            role_id: mapRoleToDatabase(professionalRole),
                            birth_date: birthDate || null,
                            avatar_url: avatarUrl || null,
                        })

                    if (insertProfileError) {
                        console.error('❌ Profile insert error:', insertProfileError)
                        throw new Error('Errore creazione profilo OAuth')
                    }
                }

                const { data: updatedProfile, error: profileError } = await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', currentUserId)
                    .select('id')
                    .maybeSingle()

                if (profileError) {
                    console.error('❌ Profile update error:', profileError)
                    throw new Error('Errore aggiornamento profilo')
                }

                if (!updatedProfile) {
                    console.error('❌ Profile update affected 0 rows for user:', currentUserId)
                    throw new Error('Profilo non trovato dopo login Google')
                }

                console.log('✅ Profile updated successfully')

                // Note: profile_stats will be created automatically by database trigger
                // or we'll create it later once schema is fixed

                // Insert sports in profile_sports
                console.log('🏀 Fetching sports from lookup_sports...', sports)

                const { data: sportsData, error: sportsError } = await supabase
                    .from('lookup_sports')
                    .select('id, name')
                    .in('name', sports)

                console.log('🏀 Sports data result:', { sportsData, sportsError })

                if (sportsError) {
                    console.error('❌ Error fetching sports:', sportsError)
                    throw new Error('Errore nel recupero degli sport')
                }

                if (!sportsData || sportsData.length === 0) {
                    console.warn('⚠️ No sports found in database for:', sports)
                }

                console.log('🏀 Deleting existing profile_sports entries...')

                // Delete existing sports first (in case user is re-doing onboarding)
                const { error: deleteError } = await supabase
                    .from('profile_sports')
                    .delete()
                    .eq('user_id', currentUserId)

                if (deleteError) {
                    console.warn('⚠️ Error deleting old sports:', deleteError)
                }

                console.log('🏀 Inserting new profile_sports entries...')

                if (sportsData && sportsData.length > 0) {
                    const profileSportsRecords = sportsData.map((sport: any, index: number) => ({
                        user_id: currentUserId,
                        sport_id: sport.id,
                        is_main_sport: index === 0,
                    }))

                    console.log('🏀 Records to insert:', profileSportsRecords)

                    const { data: insertedSports, error: insertSportsError } = await supabase
                        .from('profile_sports')
                        .insert(profileSportsRecords)
                        .select()

                    if (insertSportsError) {
                        console.error('❌ Profile sports insert error:', insertSportsError)
                    } else {
                        console.log('✅ Profile sports inserted successfully:', insertedSports)
                    }
                }

                // Update localStorage
                localStorage.setItem('currentUserRole', professionalRole)
                localStorage.setItem('currentUserSports', JSON.stringify(sports))

                // Set flag that onboarding is complete
                localStorage.setItem('onboarding_complete', 'true')

                // Vai alla home
                window.location.replace('/home')
                return
            }

            // Regular signup flow - create new user
            const firstName = localStorage.getItem('signup_firstName') || ''
            const lastName = localStorage.getItem('signup_lastName') || ''
            const email = localStorage.getItem('signup_email') || ''
            const password = localStorage.getItem('signup_password') || ''
            const birthDate = localStorage.getItem('signup_birthDate') || ''

            // Crea l'utente via service
            const newUser = await createUser({
                firstName,
                lastName,
                email,
                password,
                birthDate,
                professionalRole,
                sports,
                verified: false
            })

            // Salva dati utente per la sessione
            setCurrentUserSession({
                id: String(newUser.id),
                email: newUser.email,
                name: `${newUser.firstName} ${newUser.lastName}`,
                avatar: newUser.avatarUrl || '',
                role: newUser.professionalRole,
            })
            // Pulisci i dati temporanei di signup
            clearSignupDraft()
            // Vai alla home
            window.location.replace('/home')
        } catch (err: any) {
            console.error('Signup error:', err)
            // Mostra messaggio restituito dall'API quando disponibile
            const message = (err?.message || '').toString()
            if (message) {
                setError(message)
            } else {
                setError('Errore nella creazione del profilo. Riprova.')
            }
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-base-200 rounded-2xl shadow-xl p-8 md:p-12 border border-base-300">
                    {/* Header */}
                    <OnboardingHeader
                        title="Qual è il tuo sport principale?"
                        subtitle="Lo useremo per mostrarti persone e opportunità più rilevanti."
                        currentStep={3}
                        totalSteps={3}
                    />

                    {error && (
                        <div className="mb-6 p-4 bg-error/20 border border-error/40 rounded-lg text-error">
                            {error}
                        </div>
                    )}

                    {/* Sport Grid */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">Seleziona uno sport</h2>
                            <p className="text-secondary text-sm">Potrai aggiungere altri sport in seguito.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SUPPORTED_SPORTS.map((sport) => (
                                <button
                                    key={sport}
                                    onClick={() => handleSelectSport(sport)}
                                    disabled={isLoading}
                                    className={`p-6 rounded-xl border-2 transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selectedSports.includes(sport)
                                        ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                        : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="text-4xl mb-3">
                                        {sport === 'Calcio' && '⚽'}
                                        {sport === 'Basket' && '🏀'}
                                        {sport === 'Pallavolo' && '🏐'}
                                    </div>
                                    <div className="font-semibold text-white">{sport}</div>
                                </button>
                            ))}
                        </div>

                        {/* Conferma finale */}
                        <div className="pt-4 flex flex-col gap-4">
                            {selectedSports.length === 0 && (
                                <p className="text-xs text-secondary/70 text-center sm:text-right">Seleziona un'opzione per continuare.</p>
                            )}
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('currentUserRole')
                                        router.push('/profile-setup')
                                    }}
                                    disabled={isLoading}
                                    className="btn btn-outline border-base-300 text-secondary hover:bg-base-300 hover:text-white font-semibold py-3 px-8 order-2 sm:order-1"
                                >
                                    ← Indietro
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading || selectedSports.length === 0}
                                    className="btn btn-primary font-semibold py-3 px-10 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                            Creazione profilo…
                                        </span>
                                    ) : (
                                        'Completa profilo'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="mt-8 text-center">
                            <div className="inline-block">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                            </div>
                            <p className="text-secondary mt-3">Creazione profilo in corso...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
