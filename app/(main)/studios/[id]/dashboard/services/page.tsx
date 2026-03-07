'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type AppointmentType = {
    id: string
    name: string
    description: string | null
    duration_minutes: number
    buffer_before_minutes: number
    buffer_after_minutes: number
    price_amount: number | null
    color_hex: string
    is_active: boolean
}

const SERVICE_COLOR_PRESETS = [
    { value: '#2341F0', label: 'Blu Sprinta' },
    { value: '#2563EB', label: 'Blu Royal' },
    { value: '#0284C7', label: 'Azzurro' },
    { value: '#0EA5A4', label: 'Turchese' },
    { value: '#22C55E', label: 'Verde' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#EAB308', label: 'Giallo' },
    { value: '#F59E0B', label: 'Ambra' },
    { value: '#F97316', label: 'Arancione' },
    { value: '#EF4444', label: 'Rosso' },
    { value: '#EC4899', label: 'Fucsia' },
    { value: '#A855F7', label: 'Viola' },
    { value: '#6366F1', label: 'Indaco' },
    { value: '#64748B', label: 'Ardesia' },
]

export default function StudioDashboardServicesPage() {
    const params = useParams()
    const studioId = params.id as string

    const [services, setServices] = useState<AppointmentType[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const [form, setForm] = useState({
        name: '',
        description: '',
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        priceAmount: '',
        colorHex: '#2341F0',
    })

    useEffect(() => {
        async function loadServices() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointment-types?includeInactive=true`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                setServices(await res.json())
            }
            setLoading(false)
        }

        loadServices()
    }, [studioId])

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const payload = {
                name: form.name,
                description: form.description || null,
                durationMinutes: Number(form.durationMinutes),
                bufferBeforeMinutes: Number(form.bufferBeforeMinutes),
                bufferAfterMinutes: Number(form.bufferAfterMinutes),
                priceAmount: form.priceAmount ? Number(form.priceAmount) : null,
                colorHex: form.colorHex,
            }

            const res = await fetch(`/api/studios/${studioId}/appointment-types`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile creare il servizio')
                return
            }

            setServices((prev) => [data, ...prev])
            setForm({
                name: '',
                description: '',
                durationMinutes: 60,
                bufferBeforeMinutes: 0,
                bufferAfterMinutes: 0,
                priceAmount: '',
                colorHex: '#2341F0',
            })
            setMessage('Servizio creato.')
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (service: AppointmentType) => {
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointment-types/${service.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ isActive: !service.is_active }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile aggiornare il servizio')
                return
            }

            setServices((prev) => prev.map((item) => (item.id === service.id ? data : item)))
        } finally {
            setSaving(false)
        }
    }

    const deleteService = async (serviceId: string) => {
        if (!confirm('Eliminare questo servizio?')) return

        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointment-types/${serviceId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders,
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile eliminare il servizio')
                return
            }

            setServices((prev) => prev.filter((service) => service.id !== serviceId))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento servizi...</div>
    }

    return (
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Servizi</h1>
                <p className="mt-1 text-sm text-gray-600">Gestisci tipi di appuntamento e opzioni di prenotazione.</p>
            </div>

            <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Nome servizio</span>
                    <input
                        className="input input-bordered bg-white"
                        placeholder="Es. Prima valutazione"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Descrizione servizio</span>
                    <input
                        className="input input-bordered bg-white"
                        placeholder="Breve descrizione del servizio"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Durata appuntamento (minuti)</span>
                    <input
                        type="number"
                        className="input input-bordered bg-white"
                        min={15}
                        max={480}
                        placeholder="60"
                        value={form.durationMinutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Buffer prima (minuti)</span>
                    <input
                        type="number"
                        className="input input-bordered bg-white"
                        min={0}
                        max={60}
                        placeholder="0"
                        value={form.bufferBeforeMinutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, bufferBeforeMinutes: Number(e.target.value) }))}
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Buffer dopo (minuti)</span>
                    <input
                        type="number"
                        className="input input-bordered bg-white"
                        min={0}
                        max={60}
                        placeholder="0"
                        value={form.bufferAfterMinutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, bufferAfterMinutes: Number(e.target.value) }))}
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Prezzo (EUR)</span>
                    <input
                        type="number"
                        className="input input-bordered bg-white"
                        min={0}
                        placeholder="Es. 50"
                        value={form.priceAmount}
                        onChange={(e) => setForm((prev) => ({ ...prev, priceAmount: e.target.value }))}
                    />
                </label>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Colore servizio</span>
                    <select
                        className="select select-bordered w-full bg-white"
                        value={form.colorHex}
                        onChange={(e) => setForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                    >
                        {SERVICE_COLOR_PRESETS.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                                {preset.label} ({preset.value})
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2">
                        <p className="mb-2 text-xs text-gray-500">Palette rapida</p>
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_COLOR_PRESETS.map((preset) => {
                                const isSelected = form.colorHex === preset.value
                                return (
                                    <button
                                        key={`chip-${preset.value}`}
                                        type="button"
                                        title={`${preset.label} (${preset.value})`}
                                        aria-label={`Seleziona ${preset.label}`}
                                        className={`h-7 w-7 rounded-full border-2 transition hover:scale-105 ${isSelected ? 'border-gray-900 shadow-sm' : 'border-white shadow'
                                            }`}
                                        style={{ backgroundColor: preset.value }}
                                        onClick={() => setForm((prev) => ({ ...prev, colorHex: preset.value }))}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </label>
                <button className="btn btn-primary md:col-span-2" type="submit" disabled={saving}>
                    Crea servizio
                </button>
            </form>

            <div className="space-y-2">
                {services.length === 0 && <p className="text-sm text-gray-600">Nessun servizio creato.</p>}
                {services.map((service) => (
                    <div key={service.id} className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr,auto]">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: service.color_hex }} />
                                <p className="font-semibold text-gray-900">{service.name}</p>
                                <span className={`badge ${service.is_active ? 'badge-info' : 'badge-ghost'}`}>
                                    {service.is_active ? 'Attivo' : 'Inattivo'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                                {service.duration_minutes} min | buffer {service.buffer_before_minutes}/{service.buffer_after_minutes} min
                            </p>
                            {service.price_amount !== null && (
                                <p className="text-sm text-gray-600">Prezzo: {service.price_amount} EUR</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="btn btn-xs btn-ghost" onClick={() => toggleActive(service)} disabled={saving}>
                                {service.is_active ? 'Disattiva' : 'Attiva'}
                            </button>
                            <button className="btn btn-xs btn-error btn-outline" onClick={() => deleteService(service.id)} disabled={saving}>
                                Elimina
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {message && <p className="text-sm text-gray-600">{message}</p>}
        </section>
    )
}
