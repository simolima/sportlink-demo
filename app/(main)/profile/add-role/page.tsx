"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase as supabaseBrowser } from '@/lib/supabase-browser'
import {
    PROFESSIONAL_ROLES,
    ROLE_TRANSLATIONS,
    type ProfessionalRole,
} from '@/lib/types'
import {
    UserIcon,
    ShieldCheckIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    StarIcon,
    ScaleIcon,
    HeartIcon,
    MagnifyingGlassCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

const ROLE_ICONS: Record<ProfessionalRole, React.ComponentType<{ className?: string }>> = {
    player: UserIcon,
    coach: ShieldCheckIcon,
    agent: BriefcaseIcon,
    sporting_director: BuildingOfficeIcon,
    athletic_trainer: StarIcon,
    nutritionist: ScaleIcon,
    physio: HeartIcon,
    talent_scout: MagnifyingGlassCircleIcon,
}

export default function AddRolePage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const [existingRoles, setExistingRoles] = useState<string[]>([])
    const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    // Fetch ruoli già attivi
    useEffect(() => {
        if (!user?.id) return
        fetch(`/api/users/roles?userId=${user.id}`)
            .then(res => res.ok ? res.json() : [])
            .then((data: { role_id: string }[]) => {
                setExistingRoles(data.map(r => r.role_id))
            })
            .catch(() => { })
    }, [user?.id])

    async function handleAddRole() {
        if (!selectedRole || !user?.id) return
        setSaving(true)
        setError(null)

        try {
            const { error: insertError } = await supabaseBrowser
                .from('profile_roles')
                .insert({
                    user_id: user.id,
                    role_id: selectedRole,
                    is_active: true,
                    is_primary: false,
                })

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('Hai già questo ruolo attivo.')
                } else {
                    setError(insertError.message)
                }
                return
            }

            setSuccess(true)
            setTimeout(() => router.push('/dashboard'), 1500)
        } catch (e: any) {
            setError(e?.message ?? 'Errore imprevisto.')
        } finally {
            setSaving(false)
        }
    }

    if (isLoading || !user) return null

    const availableRoles = PROFESSIONAL_ROLES.filter(r => !existingRoles.includes(r))

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-2xl px-4 py-12">

                <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-500 hover:text-gray-700 mb-6"
                >
                    ← Indietro
                </button>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Aggiungi nuovo profilo
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                    Seleziona un nuovo ruolo professionale da aggiungere al tuo account.
                    Potrai poi passare da un profilo all&apos;altro dal menu Profilo.
                </p>

                {success ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <CheckCircleIcon className="w-16 h-16 text-green-500" />
                        <p className="text-lg font-semibold text-green-700">
                            Profilo aggiunto con successo!
                        </p>
                        <p className="text-sm text-gray-500">Reindirizzamento alla dashboard...</p>
                    </div>
                ) : (
                    <>
                        {availableRoles.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-lg">Hai già tutti i ruoli disponibili.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableRoles.map((roleId) => {
                                    const Icon = ROLE_ICONS[roleId]
                                    const isSelected = selectedRole === roleId

                                    return (
                                        <button
                                            key={roleId}
                                            onClick={() => setSelectedRole(roleId)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                                                ${isSelected
                                                    ? 'border-green-500 bg-green-50 shadow-sm'
                                                    : 'border-base-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                {ROLE_TRANSLATIONS[roleId]}
                                            </span>
                                            {isSelected && (
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {error && (
                            <p className="mt-4 text-sm text-red-600">{error}</p>
                        )}

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => router.back()}
                                className="btn btn-ghost btn-sm"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleAddRole}
                                disabled={!selectedRole || saving}
                                className="btn btn-primary btn-sm bg-green-600 hover:bg-green-700 border-0 text-white disabled:opacity-50"
                            >
                                {saving ? 'Salvataggio...' : 'Aggiungi profilo'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
