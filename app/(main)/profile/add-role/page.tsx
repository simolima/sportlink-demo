"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { switchActiveRole } from '@/app/actions/role-actions'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { isMultiSportRole, SUPPORTED_SPORTS } from '@/utils/roleHelpers'
import { SportIcon } from '@/lib/sport-icons'
import { syncLegacySelectedClubIdForRole } from '@/lib/club-membership-scope'
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
    ArrowLeftIcon,
} from '@heroicons/react/24/outline'

// ── Costanti ───────────────────────────────────────────────────────────────
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

const ROLE_DESCRIPTIONS: Record<ProfessionalRole, string> = {
    player: 'Candidati e connettiti con i club',
    coach: 'Cerca opportunità e networking',
    agent: 'Gestisci e rappresenta atleti',
    sporting_director: 'Coordina strategie sportive',
    athletic_trainer: 'Prepara atleti al massimo livello',
    nutritionist: 'Ottimizza le performance alimentari',
    physio: 'Cura e recupero degli atleti',
    talent_scout: 'Scopri e valuta nuovi talenti',
}

/** Ruoli che hanno posizioni in lookup_positions */
const ROLES_WITH_POSITIONS = ['player', 'coach']

interface LookupPosition {
    id: number
    name: string
    category: string | null
}

// ── Componente ─────────────────────────────────────────────────────────────
export default function AddRolePage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    // State globale
    const [step, setStep] = useState<1 | 2>(1)
    const [existingRoles, setExistingRoles] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Step 1: ruolo
    const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(null)
    // Step 2: sport
    const [selectedSports, setSelectedSports] = useState<string[]>([])

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoading && !user) router.push('/login')
    }, [user, isLoading, router])

    // ── Fetch ruoli esistenti ───────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id) return

            ; (async () => {
                const authHeaders = await getAuthHeaders()
                const response = await fetch('/api/users/roles', {
                    headers: authHeaders,
                })
                const data = response.ok ? await response.json() : []
                setExistingRoles((data as { role_id: string }[]).map(r => r.role_id))
            })().catch(() => { })
    }, [user?.id])

    // ── Helpers ────────────────────────────────────────────────────────────
    const totalSteps = 2
    const availableRoles = PROFESSIONAL_ROLES.filter(r => !existingRoles.includes(r))

    function handleSelectSport(sport: string) {
        if (sport === 'Multi-sport') {
            setSelectedSports(['Multi-sport'])
            return
        }
        if (selectedRole && isMultiSportRole(selectedRole)) {
            setSelectedSports(prev => {
                const withoutMulti = prev.filter(s => s !== 'Multi-sport')
                return withoutMulti.includes(sport)
                    ? withoutMulti.filter(s => s !== sport)
                    : [...withoutMulti, sport]
            })
        } else {
            setSelectedSports([sport])
        }
    }

    function goNext() {
        setError(null)
        if (step === 1 && selectedRole) {
            setStep(2)
        } else if (step === 2 && selectedSports.length > 0) {
            handleSave()
        }
    }

    function goBack() {
        setError(null)
        if (step === 2) {
            setSelectedSports([])
            setStep(1)
        }
    }

    // ── Salvataggio finale ─────────────────────────────────────────────────
    async function handleSave() {
        if (!selectedRole || !user?.id || selectedSports.length === 0 || saving) return
        setSaving(true)
        setError(null)

        try {
            const authHeaders = await getAuthHeaders()
            const bearer = authHeaders.Authorization || (authHeaders as any).authorization
            const authToken = bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined
            const response = await fetch('/api/users/roles', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    roleId: selectedRole,
                    sports: selectedSports,
                }),
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}))
                if (response.status === 409 || payload?.error === 'role_already_exists') {
                    setError('Hai già questo ruolo attivo.')
                } else if (response.status === 401) {
                    setError('Sessione scaduta. Effettua di nuovo il login.')
                } else {
                    setError(payload?.error || 'Errore nel salvataggio. Riprova.')
                }
                setSaving(false)
                return
            }

            // 2. Switch al nuovo ruolo
            await switchActiveRole(selectedRole, authToken)
            localStorage.setItem('currentUserRole', selectedRole)
            syncLegacySelectedClubIdForRole(selectedRole)
            localStorage.setItem(
                'currentUserSports',
                JSON.stringify(selectedSports)
            )

            setSuccess(true)
            setTimeout(() => { window.location.href = '/dashboard' }, 1500)
        } catch (e: any) {
            setError(e?.message ?? 'Errore imprevisto.')
            setSaving(false)
        }
    }

    // ── Loading / auth ─────────────────────────────────────────────────────
    if (isLoading || !user) return null

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
                <div className="bg-base-200 rounded-2xl shadow-xl p-8 md:p-12 border border-base-300">

                    {/* ── Header + progress ────────────────────────── */}
                    <div className="mb-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-semibold text-base-content mb-3">
                                {step === 1 && 'Scegli il ruolo'}
                                {step === 2 && 'Seleziona lo sport'}
                            </h1>
                            <p className="text-secondary text-lg">
                                {step === 1 && 'Aggiungi un nuovo profilo professionale al tuo account.'}
                                {step === 2 && (
                                    selectedRole && isMultiSportRole(selectedRole)
                                        ? 'Seleziona uno o più sport per questo profilo.'
                                        : 'Seleziona lo sport principale per questo profilo.'
                                )}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary' : 'bg-base-300'
                                        }`}
                                />
                            ))}
                            <span className="text-xs font-semibold text-secondary whitespace-nowrap px-2">
                                Passo {step} di {totalSteps}
                            </span>
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div
                                    key={`r-${i}`}
                                    className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary' : 'bg-base-300'
                                        } hidden`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Error ─────────────────────────────────────── */}
                    {error && (
                        <div className="mb-6 p-4 bg-error/20 border border-error/40 rounded-lg text-error text-sm">
                            {error}
                        </div>
                    )}

                    {/* ── Success ───────────────────────────────────── */}
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <CheckCircleIcon className="w-16 h-16 text-brand-400" />
                            <p className="text-xl font-semibold text-base-content">
                                Profilo aggiunto con successo!
                            </p>
                            <p className="text-secondary">Reindirizzamento alla dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* ═══════════ STEP 1: Ruolo ═══════════════════ */}
                            {step === 1 && (
                                <div className="space-y-8">
                                    {availableRoles.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-lg text-secondary">
                                                Hai già tutti i ruoli disponibili.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <h2 className="text-xl font-semibold text-base-content mb-2">
                                                    Seleziona un ruolo
                                                </h2>
                                                <p className="text-secondary text-sm">
                                                    Scegli il ruolo professionale con cui vuoi operare.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {availableRoles.map(roleId => {
                                                    const Icon = ROLE_ICONS[roleId]
                                                    const selected = selectedRole === roleId
                                                    return (
                                                        <button
                                                            key={roleId}
                                                            onClick={() => setSelectedRole(roleId)}
                                                            className={`p-5 rounded-xl border-2 transition-all text-left h-full flex flex-col justify-between min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selected
                                                                ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                                                : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-primary' : 'text-secondary'}`} />
                                                                <span className="font-semibold text-base-content text-lg leading-tight">
                                                                    {ROLE_TRANSLATIONS[roleId]}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-secondary">
                                                                {ROLE_DESCRIPTIONS[roleId]}
                                                            </p>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ═══════════ STEP 2: Sport ═══════════════════ */}
                            {step === 2 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-semibold text-base-content mb-2">
                                            Seleziona {selectedRole && isMultiSportRole(selectedRole) ? 'gli sport' : 'uno sport'}
                                        </h2>
                                        <p className="text-secondary text-sm">
                                            Potrai modificare la selezione in seguito dal profilo.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {SUPPORTED_SPORTS.map(sport => {
                                            const selected = selectedSports.includes(sport)
                                            return (
                                                <button
                                                    key={sport}
                                                    onClick={() => handleSelectSport(sport)}
                                                    disabled={saving}
                                                    className={`p-6 rounded-xl border-2 transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selected
                                                        ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                                        : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                                        }`}
                                                >
                                                    <div className="flex justify-center mb-3">
                                                        <SportIcon sport={sport} className="w-10 h-10" colored />
                                                    </div>
                                                    <div className="font-semibold text-base-content">{sport}</div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Opzione Multi-sport (non disponibile per player e coach) */}
                                    {selectedRole && isMultiSportRole(selectedRole) && (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex-1 h-px bg-base-300" />
                                                <span className="text-sm text-secondary px-2">Oppure:</span>
                                                <div className="flex-1 h-px bg-base-300" />
                                            </div>
                                            <button
                                                onClick={() => handleSelectSport('Multi-sport')}
                                                disabled={saving}
                                                className={`w-full p-6 rounded-xl border-2 transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${selectedSports.includes('Multi-sport')
                                                    ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                                    : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-3">🌐</div>
                                                <div className="font-semibold text-base-content">Multi-sport</div>
                                                <div className="text-xs text-secondary mt-1">Lavoro su più discipline sportive</div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Bottoni navigazione ──────────────────── */}
                            <div className="pt-8 flex flex-col sm:flex-row justify-between gap-4">
                                {step === 1 ? (
                                    <button
                                        onClick={() => router.back()}
                                        className="btn btn-outline border-base-300 text-secondary hover:bg-base-300 hover:text-base-content font-semibold py-3 px-8 order-2 sm:order-1"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                        Indietro
                                    </button>
                                ) : (
                                    <button
                                        onClick={goBack}
                                        disabled={saving}
                                        className="btn btn-outline border-base-300 text-secondary hover:bg-base-300 hover:text-base-content font-semibold py-3 px-8 order-2 sm:order-1"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                        Indietro
                                    </button>
                                )}

                                <button
                                    onClick={goNext}
                                    disabled={
                                        saving ||
                                        (step === 1 && !selectedRole) ||
                                        (step === 2 && selectedSports.length === 0)
                                    }
                                    className="btn btn-primary font-semibold py-3 px-10 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Creazione profilo...
                                        </span>
                                    ) : step === totalSteps ? (
                                        'Crea profilo'
                                    ) : (
                                        'Continua'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
