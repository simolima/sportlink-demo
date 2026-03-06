// Server Component — nessuna direttiva 'use client'
import { HeartIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { createServerClient } from '@/lib/supabase-server'
import ReportInjuryModal from '@/components/widgets/ReportInjuryModal'
import ResolveInjuryButton from '@/components/widgets/ResolveInjuryButton'
import type { InjuryType, InjurySeverity, InjuryStatus } from '@/app/actions/injury-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Tipi DB (snake_case)
// ─────────────────────────────────────────────────────────────────────────────

interface DbInjury {
    id: string
    injury_type: InjuryType
    body_part: string | null
    severity: InjurySeverity
    start_date: string
    expected_return_date: string | null
    status: InjuryStatus
    notes: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers di render
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<InjurySeverity, string> = {
    Lieve: 'badge-warning',
    Moderato: 'badge-orange',   // DaisyUI non ha "orange" nativo → usiamo classe custom
    Grave: 'badge-error',
}

const STATUS_CONFIG: Record<
    InjuryStatus,
    { label: string; badgeClass: string; rowClass: string }
> = {
    Active: {
        label: 'Infortunato',
        badgeClass: 'badge-error',
        rowClass: 'border-l-2 border-red-400',
    },
    Recovering: {
        label: 'In Recupero',
        badgeClass: 'badge-warning',
        rowClass: 'border-l-2 border-yellow-400',
    },
    Resolved: {
        label: 'Guarito',
        badgeClass: 'badge-success',
        rowClass: 'border-l-2 border-green-400',
    },
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    athleteId: string
    /** Se true, mostra il bottone "Segnala Infortunio" (es. DS, physio, l'atleta stesso) */
    canReport?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget
// ─────────────────────────────────────────────────────────────────────────────

export default async function PhysicalStatusWidget({ athleteId, canReport = true }: Props) {
    const supabase = await createServerClient()

    const { data: rows, error } = await supabase
        .from('athlete_injuries')
        .select(
            'id, injury_type, body_part, severity, start_date, expected_return_date, status, notes',
        )
        .eq('athlete_profile_id', athleteId)
        .is('deleted_at', null)
        .order('start_date', { ascending: false })
        .limit(20)

    if (error) {
        console.error('[PhysicalStatusWidget] query error:', error)
    }

    const injuries = (rows as DbInjury[] | null) ?? []

    // Infortunio corrente = primo in ordine (più recente) con status Active o Recovering
    const currentInjury = injuries.find(
        (i) => i.status === 'Active' || i.status === 'Recovering',
    ) ?? null

    const isAvailable = currentInjury === null

    // Storico = tutti tranne il corrente (o tutti se disponibile)
    const historyInjuries = currentInjury
        ? injuries.filter((i) => i.id !== currentInjury.id)
        : injuries

    return (
        <div className="card bg-white border border-base-200 shadow-sm">
            <div className="card-body p-5 space-y-4">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <HeartIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <h2 className="font-semibold text-gray-800 text-base">Stato Fisico</h2>
                    </div>
                    {canReport && <ReportInjuryModal athleteId={athleteId} />}
                </div>

                {/* ── Stato attuale ── */}
                <div
                    className={`rounded-xl p-4 flex items-center gap-4 ${isAvailable
                            ? 'bg-green-50 border border-green-100'
                            : currentInjury?.status === 'Recovering'
                                ? 'bg-yellow-50 border border-yellow-100'
                                : 'bg-red-50 border border-red-100'
                        }`}
                >
                    {/* Icona grande */}
                    <div
                        className={`rounded-full p-3 flex-shrink-0 ${isAvailable
                                ? 'bg-green-100'
                                : currentInjury?.status === 'Recovering'
                                    ? 'bg-yellow-100'
                                    : 'bg-red-100'
                            }`}
                    >
                        {isAvailable ? (
                            <CheckCircleIcon className="h-7 w-7 text-green-600" />
                        ) : currentInjury?.status === 'Recovering' ? (
                            <ClockIcon className="h-7 w-7 text-yellow-600" />
                        ) : (
                            <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
                        )}
                    </div>

                    {/* Testo stato */}
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                            Stato Attuale
                        </p>
                        {isAvailable ? (
                            <p className="text-lg font-bold text-green-700">DISPONIBILE</p>
                        ) : (
                            <>
                                <p
                                    className={`text-lg font-bold ${currentInjury?.status === 'Recovering'
                                            ? 'text-yellow-700'
                                            : 'text-red-700'
                                        }`}
                                >
                                    {currentInjury?.status === 'Recovering'
                                        ? 'IN RECUPERO'
                                        : 'INFORTUNATO'}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {/* Tipo e parte */}
                                    <span className="text-sm text-gray-600">
                                        {currentInjury?.injury_type}
                                        {currentInjury?.body_part &&
                                            ` — ${currentInjury?.body_part}`}
                                    </span>

                                    {/* Badge gravità */}
                                    <span
                                        className={`badge badge-sm ${SEVERITY_BADGE[currentInjury!.severity]
                                            }`}
                                    >
                                        {currentInjury?.severity}
                                    </span>
                                </div>

                                {/* Data rientro stimata */}
                                {currentInjury?.expected_return_date && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Rientro stimato:{' '}
                                        <span className="font-semibold text-gray-700">
                                            {formatDate(currentInjury.expected_return_date)}
                                        </span>
                                    </p>
                                )}

                                {/* Bottone "Segna Guarito" */}
                                <div className="mt-2">
                                    <ResolveInjuryButton
                                        injuryId={currentInjury!.id}
                                        athleteId={athleteId}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Nessuno storico ── */}
                {injuries.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">
                        Nessun infortunio registrato.
                    </p>
                )}

                {/* ── Cronologia ── */}
                {historyInjuries.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Storico
                        </p>

                        <div className="space-y-2">
                            {historyInjuries.map((injury) => {
                                const cfg = STATUS_CONFIG[injury.status]
                                return (
                                    <div
                                        key={injury.id}
                                        className={`pl-3 py-2 pr-2 rounded-r-lg bg-base-50 ${cfg.rowClass}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {injury.injury_type}
                                                        {injury.body_part && ` — ${injury.body_part}`}
                                                    </span>
                                                    <span
                                                        className={`badge badge-xs ${SEVERITY_BADGE[injury.severity]}`}
                                                    >
                                                        {injury.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {formatDate(injury.start_date)}
                                                    {injury.expected_return_date &&
                                                        ` → ${formatDate(injury.expected_return_date)}`}
                                                </p>
                                                {injury.notes && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                        {injury.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                                <span className={`badge badge-sm ${cfg.badgeClass}`}>
                                                    {cfg.label}
                                                </span>
                                                {/* Permette di segnare "Guarito" anche dallo storico */}
                                                {injury.status !== 'Resolved' && (
                                                    <ResolveInjuryButton
                                                        injuryId={injury.id}
                                                        athleteId={athleteId}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
