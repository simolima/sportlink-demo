// Server Component (async) — nessuna direttiva 'use client'
import { Suspense } from 'react'
import { getActiveRole } from '@/app/actions/role-actions'
import { createServerClient } from '@/lib/supabase-server'
import { ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'
import RoleSwitcher from '@/components/ui/RoleSwitcher'
import TeamEventsWidget from '@/components/widgets/TeamEventsWidget'
import StudioAppointmentsWidget from '@/components/widgets/StudioAppointmentsWidget'
import StudioSettingsWidget from '@/components/widgets/StudioSettingsWidget'
import PhysicalStatusWidget from '@/components/widgets/PhysicalStatusWidget'

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton condiviso — mostrato da Suspense durante lo streaming dei widget
// ─────────────────────────────────────────────────────────────────────────────
function WidgetSkeleton() {
    return (
        <div className="card bg-white border border-base-200 shadow-sm animate-pulse">
            <div className="card-body p-5">
                <div className="h-5 w-40 rounded bg-gray-200 mb-4" />
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-200" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-24 rounded bg-gray-200" />
                                <div className="h-4 w-36 rounded bg-gray-200" />
                                <div className="h-3 w-20 rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Classi di appartenenza ruolo
// ─────────────────────────────────────────────────────────────────────────────
/** Team-based roles: vedono gli eventi della squadra */
const TEAM_ROLES: ProfessionalRole[] = ['player', 'coach', 'sporting_director', 'athletic_trainer']

/** Studio/clinic roles: vedono gli appuntamenti */
const STUDIO_ROLES: ProfessionalRole[] = ['physio', 'nutritionist']

/** Ruoli che gestiscono uno studio: possono creare/modificare studio settings */
const STUDIO_MANAGER_ROLES: ProfessionalRole[] = ['physio', 'nutritionist', 'athletic_trainer']

/** Mostra entrambi i widget (es. preparatore atletico in uno studio e in un team) */
const DUAL_ROLES: ProfessionalRole[] = ['athletic_trainer', 'talent_scout', 'agent']

// ─────────────────────────────────────────────────────────────────────────────
// Fetch dei ruoli disponibili per l'utente autenticato.
// Legge prima da profile_roles (nuova tabella) e ricade su profiles.role_id.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAvailableRoles(userId: string): Promise<ProfessionalRole[]> {
    const supabase = await createServerClient()

    // Prova dalla nuova tabella profile_roles
    const { data: roleRows, error } = await supabase
        .from('profile_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('is_active', true)

    if (!error && roleRows && roleRows.length > 0) {
        return roleRows.map((r: { role_id: string }) => r.role_id as ProfessionalRole)
    }

    // Fallback: legge il singolo role_id dal profilo legacy
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .is('deleted_at', null)
        .single()

    if (profile?.role_id) {
        return [profile.role_id as ProfessionalRole]
    }

    return ['player']
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Server Component principale
// ─────────────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
    // 1. Autenticazione — redirect gestito implicitamente dal layout (main)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // In produzione il middleware/layout intercetta questo caso prima;
        // lo gestiamo qui per type-safety.
        return null
    }

    // 2. Ruolo attivo dal cookie (o fallback 'player')
    const activeRole = await getActiveRole()

    // 3. Ruoli disponibili per l'utente (per popolare il RoleSwitcher)
    const availableRoles = await fetchAvailableRoles(user.id)

    // 4. Determina quali widget mostrare
    const showTeamEvents =
        TEAM_ROLES.includes(activeRole) || DUAL_ROLES.includes(activeRole)

    const showStudioAppointments =
        STUDIO_ROLES.includes(activeRole) || DUAL_ROLES.includes(activeRole)

    const showStudioSettings = STUDIO_MANAGER_ROLES.includes(activeRole)

    const showPhysicalStatus = activeRole === 'player'

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl px-4 py-8">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Stai navigando come&nbsp;
                            <span className="font-medium text-green-700">
                                {ROLE_TRANSLATIONS[activeRole] ?? activeRole}
                            </span>
                        </p>
                    </div>

                    {/* Role Switcher: Client Component isolato, non blocca il render */}
                    {availableRoles.length > 1 && (
                        <RoleSwitcher
                            activeRole={activeRole}
                            availableRoles={availableRoles}
                        />
                    )}
                </div>

                {/* ── Widget Grid ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Widget 1: eventi della squadra */}
                    {showTeamEvents && (
                        <Suspense fallback={<WidgetSkeleton />}>
                            {/*
                             * TeamEventsWidget è un Server Component async.
                             * Suspense streamma lo skeleton finché il await interno non risolve.
                             * Questo NON blocca il rendering degli altri widget.
                             */}
                            <TeamEventsWidget userId={user.id} activeRole={activeRole} />
                        </Suspense>
                    )}

                    {/* Widget 2: gestione studio */}
                    {showStudioSettings && (
                        <Suspense fallback={<WidgetSkeleton />}>
                            <StudioSettingsWidget userId={user.id} activeRole={activeRole} />
                        </Suspense>
                    )}

                    {/* Widget 3: appuntamenti studio */}
                    {showStudioAppointments && (
                        <Suspense fallback={<WidgetSkeleton />}>
                            <StudioAppointmentsWidget userId={user.id} activeRole={activeRole} />
                        </Suspense>
                    )}

                    {/* Widget 4: stato fisico infortuni (solo player) */}
                    {showPhysicalStatus && (
                        <Suspense fallback={<WidgetSkeleton />}>
                            <PhysicalStatusWidget athleteId={user.id} canReport={true} />
                        </Suspense>
                    )}

                    {/* Stato vuoto: ruoli senza widget dedicato (agent, talent_scout...) */}
                    {!showTeamEvents && !showStudioAppointments && !showStudioSettings && !showPhysicalStatus && (
                        <div className="col-span-full">
                            <div className="card bg-white border border-base-200 shadow-sm">
                                <div className="card-body items-center py-12 text-center">
                                    <p className="text-gray-400">
                                        Nessun widget disponibile per il ruolo{' '}
                                        <span className="font-medium">
                                            {ROLE_TRANSLATIONS[activeRole] ?? activeRole}
                                        </span>
                                        .
                                    </p>
                                    <p className="mt-1 text-sm text-gray-300">
                                        Presto disponibili nuovi moduli.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
