// Server Component — nessuna direttiva 'use client'
import { ClockIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { createServerClient } from '@/lib/supabase-server'
import type { ProfessionalRole } from '@/lib/types'

interface Props {
    userId: string
    activeRole: ProfessionalRole
}

interface Appointment {
    id: string
    startTime: string
    endTime: string
    serviceType: string | null
    clientName: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    isExternalBlocker: boolean
    studioName?: string | null
}

// Ruoli professionisti: vedono i clienti per studio_id
const PROFESSIONAL_ROLES: ProfessionalRole[] = ['physio', 'nutritionist', 'athletic_trainer']

// ─────────────────────────────────────────────────────────────────────────────
// Fetch per PROFESSIONISTI (physio / nutritionist / athletic_trainer)
//   Cerca prima lo studio dell'utente, poi gli appuntamenti futuri.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAppointmentsForProfessional(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
): Promise<Appointment[]> {
    // Step 1: recupera lo studio dell'utente (1 studio per owner)
    const { data: studio } = await supabase
        .from('professional_studios')
        .select('id')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

    if (!studio) return []

    // Step 2: appuntamenti futuri dello studio con join al profilo cliente
    // Mapping DB: client_id → profiles(first_name, last_name)
    const { data: rows, error } = await supabase
        .from('studio_appointments')
        .select(
            'id, start_time, end_time, service_type, status, is_external_blocker,' +
            'client:profiles!studio_appointments_client_id_fkey(first_name, last_name)'
        )
        .eq('studio_id', studio.id)
        .gte('start_time', new Date().toISOString())
        .not('status', 'eq', 'cancelled')
        .is('deleted_at', null)
        .order('start_time', { ascending: true })
        .limit(10)

    if (error) {
        console.error('[StudioAppointmentsWidget] professional query error:', error)
        return []
    }

    return (rows ?? []).map((r: any) => ({
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        serviceType: r.service_type,
        status: r.status,
        isExternalBlocker: r.is_external_blocker,
        // Se è un blocker personale, non esporre il nome
        clientName: r.is_external_blocker
            ? 'Impegno Personale'
            : `${r.client?.first_name ?? ''} ${r.client?.last_name ?? ''}`.trim() || 'Cliente',
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch per PLAYER / altri ruoli
//   Cerca gli appuntamenti in cui l'utente è il cliente, con nome dello studio.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAppointmentsForClient(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
): Promise<Appointment[]> {
    const { data: rows, error } = await supabase
        .from('studio_appointments')
        .select(
            'id, start_time, end_time, service_type, status, is_external_blocker,' +
            'studio:professional_studios!studio_appointments_studio_id_fkey(name)'
        )
        .eq('client_id', userId)
        .gte('start_time', new Date().toISOString())
        .not('status', 'eq', 'cancelled')
        .is('deleted_at', null)
        .order('start_time', { ascending: true })
        .limit(10)

    if (error) {
        console.error('[StudioAppointmentsWidget] client query error:', error)
        return []
    }

    return (rows ?? []).map((r: any) => ({
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        serviceType: r.service_type,
        status: r.status,
        isExternalBlocker: r.is_external_blocker,
        clientName: r.studio?.name ?? 'Studio',
        studioName: r.studio?.name ?? null,
    }))
}

async function fetchUpcomingAppointments(userId: string, activeRole: ProfessionalRole): Promise<Appointment[]> {
    const supabase = await createServerClient()

    return PROFESSIONAL_ROLES.includes(activeRole)
        ? fetchAppointmentsForProfessional(supabase, userId)
        : fetchAppointmentsForClient(supabase, userId)
}

const STATUS_STYLES: Record<Appointment['status'], string> = {
    confirmed: 'badge-success',
    pending: 'badge-warning',
    cancelled: 'badge-error',
    completed: 'badge-ghost',
}

const STATUS_LABELS: Record<Appointment['status'], string> = {
    confirmed: 'Confermato',
    pending: 'In attesa',
    cancelled: 'Cancellato',
    completed: 'Completato',
}

export default async function StudioAppointmentsWidget({ userId, activeRole }: Props) {
    const appointments = await fetchUpcomingAppointments(userId, activeRole)

    const isProfessional = PROFESSIONAL_ROLES.includes(activeRole)
    const title = isProfessional ? 'Appuntamenti con i Clienti' : 'I Tuoi Appuntamenti'

    return (
        <div className="card bg-white border border-base-200 shadow-sm">
            <div className="card-body p-5">
                <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="h-5 w-5 text-brand-600" />
                    <h2 className="card-title text-base font-semibold text-gray-800">{title}</h2>
                </div>

                {appointments.length === 0 ? (
                    <p className="text-sm text-gray-400">Nessun appuntamento in programma.</p>
                ) : (
                    <ul className="space-y-3">
                        {appointments.map((appt) => {
                            const start = new Date(appt.startTime)
                            const end = new Date(appt.endTime)
                            const durationMins = Math.round((end.getTime() - start.getTime()) / 60000)

                            return (
                                <li
                                    key={appt.id}
                                    className="flex items-start gap-3 rounded-lg border border-base-100 bg-gray-50 px-3 py-2.5"
                                >
                                    <div className="flex-shrink-0 text-center min-w-[2.5rem]">
                                        <p className="text-xs font-bold uppercase text-brand-600">
                                            {start.toLocaleDateString('it-IT', { weekday: 'short' })}
                                        </p>
                                        <p className="text-lg font-bold leading-none text-gray-800">
                                            {start.getDate()}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`badge badge-sm border-0 ${STATUS_STYLES[appt.status]}`}>
                                                {STATUS_LABELS[appt.status]}
                                            </span>
                                            {appt.serviceType && (
                                                <span className="text-xs text-gray-500">{appt.serviceType}</span>
                                            )}
                                        </div>
                                        {appt.isExternalBlocker ? (
                                            <p className="flex items-center gap-1 text-sm font-medium text-gray-500 italic">
                                                <LockClosedIcon className="h-3.5 w-3.5 text-gray-400" />
                                                Non disponibile
                                            </p>
                                        ) : (
                                            <p className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                                <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                                                {appt.clientName}
                                            </p>
                                        )}
                                    </div>
                                    <p className="flex-shrink-0 text-xs text-gray-400 mt-0.5 text-right">
                                        {start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                        <br />
                                        <span className="text-gray-300">{durationMins} min</span>
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
