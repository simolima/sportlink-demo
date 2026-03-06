// Server Component — nessuna direttiva 'use client'
import { BuildingStorefrontIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { createServerClient } from '@/lib/supabase-server'
import CreateStudioModal from '@/components/events/CreateStudioModal'
import type { ProfessionalRole } from '@/lib/types'
import type { StudioInput } from '@/app/actions/studio-actions'

interface Props {
    userId: string
    activeRole: ProfessionalRole
}

/** Ruoli che vedono il widget di gestione studio */
const STUDIO_MANAGER_ROLES: ProfessionalRole[] = ['physio', 'nutritionist', 'athletic_trainer']

interface StudioRow {
    id: string
    name: string
    city: string | null
    address: string | null
    phone: string | null
    website: string | null
    description: string | null
    services_offered: string[]
    sync_gcal: boolean
    google_calendar_id: string | null
}

async function fetchOwnedStudio(userId: string): Promise<StudioRow | null> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('professional_studios')
        .select('id, name, city, address, phone, website, description, services_offered, sync_gcal, google_calendar_id')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
        console.error('[StudioSettingsWidget] fetchOwnedStudio error:', error)
        return null
    }

    return data as StudioRow | null
}

export default async function StudioSettingsWidget({ userId, activeRole }: Props) {
    if (!STUDIO_MANAGER_ROLES.includes(activeRole)) return null

    const studio = await fetchOwnedStudio(userId)

    // Dati per il modal "modifica" — mapping snake_case → camelCase/StudioInput
    const existingForModal: (Partial<StudioInput> & { id?: string }) | undefined = studio
        ? {
            id: studio.id,
            name: studio.name,
            city: studio.city ?? '',
            address: studio.address,
            phone: studio.phone,
            website: studio.website,
            description: studio.description,
            services_offered: studio.services_offered ?? [],
        }
        : undefined

    // ── STATO VUOTO — l'utente non ha ancora uno studio ──────────────────────
    if (!studio) {
        return (
            <div className="card bg-white border border-base-200 shadow-sm">
                <div className="card-body items-center py-10 text-center gap-3">
                    <div className="rounded-full bg-green-50 p-4">
                        <BuildingStorefrontIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">Nessuno studio configurato</h2>
                        <p className="mt-1 text-sm text-gray-400 max-w-xs">
                            Crea il tuo studio per mostrare i servizi offerti e ricevere prenotazioni dagli atleti.
                        </p>
                    </div>
                    {/* Client Component — apre il modal form */}
                    <CreateStudioModal />
                </div>
            </div>
        )
    }

    // ── STATO CON STUDIO ─────────────────────────────────────────────────────
    return (
        <div className="card bg-white border border-base-200 shadow-sm">
            <div className="card-body p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                        <BuildingStorefrontIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <h2 className="card-title text-base font-semibold text-gray-800">
                            {studio.name}
                        </h2>
                    </div>
                    <CreateStudioModal existing={existingForModal} />
                </div>

                {/* Info principali */}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {studio.city && (
                        <p>
                            <span className="font-medium text-gray-700">Città: </span>
                            {studio.city}
                        </p>
                    )}
                    {studio.address && (
                        <p>
                            <span className="font-medium text-gray-700">Indirizzo: </span>
                            {studio.address}
                        </p>
                    )}
                    {studio.phone && (
                        <p>
                            <span className="font-medium text-gray-700">Tel: </span>
                            {studio.phone}
                        </p>
                    )}
                </div>

                {/* Servizi offerti */}
                {studio.services_offered?.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Servizi offerti
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {studio.services_offered.map((s) => (
                                <span
                                    key={s}
                                    className="badge badge-sm bg-green-50 text-green-700 border-0"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Google Calendar sync — placeholder (non funzionante, per ora) */}
                <div className="divider my-2" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                Sincronizza con Google Calendar
                            </p>
                            <p className="text-xs text-gray-400">
                                {studio.sync_gcal
                                    ? 'Sincronizzazione attiva'
                                    : 'Non ancora configurata'}
                            </p>
                        </div>
                    </div>
                    {/* Toggle placeholder — la logica OAuth verrà implementata in Fase 5 */}
                    <div
                        className="tooltip tooltip-left"
                        data-tip="Disponibile prossimamente"
                    >
                        <input
                            type="checkbox"
                            className="toggle toggle-success toggle-sm"
                            checked={studio.sync_gcal}
                            readOnly
                            disabled
                            aria-label="Sincronizzazione Google Calendar"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
