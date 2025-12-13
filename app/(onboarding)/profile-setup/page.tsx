"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { PROFESSIONAL_ROLES, isMultiSportRole } from '@/utils/roleHelpers'
import { ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'

// Descrizioni brevi per ogni ruolo
const ROLE_DESCRIPTIONS: Record<ProfessionalRole, string> = {
    'Player': 'Candidati e connettiti con i club',
    'Coach': 'Cerca opportunità e networking',
    'Agent': 'Gestisci e rappresenti atleti',
    'Sporting Director': 'Coordina strategie sportive',
    'Athletic Trainer': 'Prepara atleti al massimo livello',
    'Nutritionist': 'Ottimizza le performance alimentari',
    'Physio/Masseur': 'Cura e recupero degli atleti',
}

export default function Page() {
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<ProfessionalRole | ''>('')
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || checked) return
        setChecked(true)
        // Controlla che tutti i dati temporanei siano presenti
        const firstName = localStorage.getItem('signup_firstName')
        const lastName = localStorage.getItem('signup_lastName')
        const email = localStorage.getItem('signup_email')
        const password = localStorage.getItem('signup_password')
        const birthDate = localStorage.getItem('signup_birthDate')
        const currentUserId = localStorage.getItem('currentUserId')
        const currentUserRole = localStorage.getItem('currentUserRole')
        const currentUserSport = localStorage.getItem('currentUserSport')

        if (!firstName || !lastName || !email || !password || !birthDate) {
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserRole')
            localStorage.removeItem('currentUserSport')
            if (currentUserId) {
                router.replace('/home')
            } else {
                router.replace('/signup')
            }
            return
        }
        // Se il ruolo è già stato selezionato, vai a /select-sport
        if (currentUserRole && !currentUserSport) {
            router.replace('/select-sport')
            return
        }
        // Se l'utente ha già completato il profilo, non serve rifare lo step
        if (currentUserId && currentUserRole && currentUserSport) {
            router.replace('/home')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked, router])

    const handleComplete = async () => {
        if (!selectedRole) {
            alert('Devi selezionare un ruolo prima di procedere')
            return
        }
        setLoading(true)
        try {
            if (typeof window === 'undefined') return;
            // Salva il ruolo in localStorage
            localStorage.setItem('currentUserRole', selectedRole)
            // Vai al prossimo step
            router.push('/select-sport')
        } catch (err) {
            alert('Errore durante la selezione del ruolo')
        } finally {
            setLoading(false)
        }
    }

    // Non serve più controllare user: la pagina si mostra se i dati sono in localStorage

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-base-200 rounded-2xl shadow-xl p-8 md:p-12 border border-base-300">
                    {/* Header */}
                    <OnboardingHeader
                        title="Qual è il tuo ruolo?"
                        subtitle="Serve per personalizzare opportunità e connessioni."
                        currentStep={1}
                    />

                    {/* Role Selection */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">Seleziona un ruolo</h2>
                            <p className="text-secondary text-sm">Potrai cambiarlo in seguito dal profilo.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PROFESSIONAL_ROLES.map((role) => {
                                const label = ROLE_TRANSLATIONS[role]
                                const hasSlash = label.includes('/')

                                return (
                                    <button
                                        key={role}
                                        onClick={() => setSelectedRole(role)}
                                        className={`p-5 rounded-xl border-2 transition-all text-left cursor-pointer h-full flex flex-col justify-between min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selectedRole === role
                                            ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                            }`}
                                    >
                                        <div className="font-semibold text-white text-lg mb-1 leading-tight">
                                            {hasSlash ? (
                                                label.split('/').map((part, i) => (
                                                    <span key={i} className="block">{part.trim()}</span>
                                                ))
                                            ) : (
                                                label
                                            )}
                                        </div>
                                        <div className="text-sm text-secondary break-words whitespace-normal">{ROLE_DESCRIPTIONS[role]}</div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Pulsante di conferma per proseguire */}
                        <div className="pt-4 flex flex-col items-center sm:items-end gap-2">
                            {!selectedRole && (
                                <p className="text-xs text-secondary/70">Seleziona un'opzione per continuare.</p>
                            )}
                            <button
                                onClick={handleComplete}
                                disabled={loading || !selectedRole}
                                className="btn btn-primary font-semibold py-3 px-10 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Continua...' : 'Continua'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
