"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { PROFESSIONAL_ROLES, ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'
import Image from 'next/image'

export default function ProfileSetupPage() {
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<ProfessionalRole | ''>('')
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || checked) return;
        setChecked(true);
        // Controlla che tutti i dati temporanei siano presenti
        const firstName = localStorage.getItem('signup_firstName')
        const lastName = localStorage.getItem('signup_lastName')
        const email = localStorage.getItem('signup_email')
        const password = localStorage.getItem('signup_password')
        const birthDate = localStorage.getItem('signup_birthDate')
        const sport = localStorage.getItem('currentUserSport')
        // Se manca QUALSIASI dato, pulisci tutto e riparti da zero
        if (!firstName || !lastName || !email || !password || !birthDate || !sport) {
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            localStorage.removeItem('currentUserSport')
            router.push('/signup')
            return
        }
    }, [router, checked])

    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    const handleComplete = async () => {
        if (!selectedRole) {
            alert('Devi selezionare un ruolo prima di procedere')
            return
        }
        setLoading(true)
        try {
            if (typeof window === 'undefined') return;
            // Recupera tutti i dati dal localStorage
            const firstName = localStorage.getItem('signup_firstName') || ''
            const lastName = localStorage.getItem('signup_lastName') || ''
            const email = localStorage.getItem('signup_email') || ''
            const password = localStorage.getItem('signup_password') || ''
            const birthDate = localStorage.getItem('signup_birthDate') || ''
            const sport = localStorage.getItem('currentUserSport') || ''
            const professionalRole = selectedRole

            // Crea l'utente via API
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    birthDate,
                    sport,
                    professionalRole,
                    verified: false
                })
            })
            if (!res.ok) {
                alert('Errore durante la creazione del profilo')
                setLoading(false)
                return
            }
            const newUser = await res.json()
            // Salva dati utente per la sessione
            localStorage.setItem('currentUserId', String(newUser.id))
            localStorage.setItem('currentUserEmail', newUser.email)
            localStorage.setItem('currentUserName', `${newUser.firstName} ${newUser.lastName}`)
            localStorage.setItem('currentUserAvatar', newUser.avatarUrl || '')
            localStorage.setItem('currentUserSport', newUser.sport || '')
            localStorage.setItem('currentUserRole', newUser.professionalRole || '')
            // Pulisci i dati temporanei
            localStorage.removeItem('signup_firstName')
            localStorage.removeItem('signup_lastName')
            localStorage.removeItem('signup_email')
            localStorage.removeItem('signup_password')
            localStorage.removeItem('signup_birthDate')
            // Vai alla home (forza reload per Auth sync)
            window.location.replace('/home')
        } catch (err) {
            alert('Errore durante la creazione del profilo')
        } finally {
            setLoading(false)
        }
    }

    // Non serve più controllare user: la pagina si mostra se i dati sono in localStorage

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-green-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Image src="/logo.svg" alt="SPRINTA" width={40} height={40} className="rounded" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benvenuto!</h1>
                        <p className="text-gray-600">Seleziona il tuo ruolo professionale</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 h-1 bg-green-600 rounded"></div>
                            <span className="text-xs font-semibold text-gray-600">Passo 2 di 2</span>
                            <div className="flex-1 h-1 bg-green-600 rounded"></div>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Qual è il tuo ruolo?</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {PROFESSIONAL_ROLES.map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedRole === role
                                        ? 'border-green-600 bg-green-50 ring-2 ring-green-500'
                                        : 'border-gray-200 bg-white hover:border-green-300'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-900">{ROLE_TRANSLATIONS[role]}</div>
                                    <div className="text-xs text-gray-500 mt-1">Professional</div>
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                onClick={handleComplete}
                                disabled={loading || !selectedRole}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {loading ? 'Salvataggio...' : 'Completa Profilo →'}
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 Potrai modificare il tuo ruolo dal profilo in seguito.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
