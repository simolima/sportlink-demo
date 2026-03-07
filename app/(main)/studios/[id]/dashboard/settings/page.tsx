'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/address-autocomplete'
import { getAuthHeaders } from '@/lib/auth-fetch'

type StudioSettings = {
    name: string
    city: string
    address: string
    phone: string
    website: string
    description: string
    bookingEnabled: boolean
    autoConfirmBookings: boolean
    slotIncrementMinutes: 15 | 30 | 60
    defaultBufferBetweenAppointments: number
}

const DEFAULT_SETTINGS: StudioSettings = {
    name: '',
    city: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    bookingEnabled: false,
    autoConfirmBookings: false,
    slotIncrementMinutes: 30,
    defaultBufferBetweenAppointments: 5,
}

export default function StudioDashboardSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const studioId = params.id as string

    const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function loadSettings() {
            const res = await fetch(`/api/studios/${studioId}`)
            if (!res.ok) {
                router.replace('/studios')
                return
            }

            const data = await res.json()
            setSettings({
                name: data.name || '',
                city: data.city || '',
                address: data.address || '',
                phone: data.phone || '',
                website: data.website || '',
                description: data.description || '',
                bookingEnabled: Boolean(data.bookingEnabled),
                autoConfirmBookings: Boolean(data.autoConfirmBookings),
                slotIncrementMinutes: (data.slotIncrementMinutes || 30) as 15 | 30 | 60,
                defaultBufferBetweenAppointments: Number(data.defaultBufferBetweenAppointments || 5),
            })

            setLoading(false)
        }

        loadSettings()
    }, [router, studioId])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify(settings),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile salvare le impostazioni dello studio')
                return
            }

            setMessage('Impostazioni salvate con successo.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento impostazioni...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
                <p className="mt-1 text-sm text-gray-600">Profilo studio e configurazione prenotazioni.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Nome studio</span>
                        <input
                            className="input input-bordered bg-white"
                            placeholder="Nome studio"
                            value={settings.name}
                            onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Citta</span>
                        <input
                            className="input input-bordered bg-white"
                            placeholder="Citta"
                            value={settings.city}
                            onChange={(e) => setSettings((prev) => ({ ...prev, city: e.target.value }))}
                        />
                    </label>
                </div>

                <div>
                    <label className="mb-1 block text-sm text-gray-600">Indirizzo</label>
                    <AddressAutocomplete
                        value={settings.address}
                        onChange={({ address, city }) => {
                            setSettings((prev) => ({
                                ...prev,
                                address,
                                city: city || prev.city,
                            }))
                        }}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Telefono</span>
                        <input
                            className="input input-bordered bg-white"
                            placeholder="Telefono"
                            value={settings.phone}
                            onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Sito web</span>
                        <input
                            className="input input-bordered bg-white"
                            placeholder="Sito web"
                            value={settings.website}
                            onChange={(e) => setSettings((prev) => ({ ...prev, website: e.target.value }))}
                        />
                    </label>
                </div>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-gray-600">Descrizione</span>
                    <textarea
                        className="textarea textarea-bordered bg-white w-full"
                        rows={4}
                        placeholder="Descrizione"
                        value={settings.description}
                        onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                    />
                </label>

                <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-2">
                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.bookingEnabled}
                            onChange={(e) => setSettings((prev) => ({ ...prev, bookingEnabled: e.target.checked }))}
                        />
                        <span className="label-text inline-flex items-center gap-2">
                            Abilita prenotazioni online
                            <span
                                className="tooltip tooltip-top"
                                data-tip="Quando attivo, i clienti possono vedere gli slot disponibili e inviare nuove richieste di prenotazione online."
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-600">
                                    ?
                                </span>
                            </span>
                        </span>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.autoConfirmBookings}
                            onChange={(e) => setSettings((prev) => ({ ...prev, autoConfirmBookings: e.target.checked }))}
                        />
                        <span className="label-text inline-flex items-center gap-2">
                            Conferma automatica prenotazioni
                            <span
                                className="tooltip tooltip-top"
                                data-tip="Quando attivo, le nuove prenotazioni vengono confermate subito senza approvazione manuale. Se disattivo, restano in attesa."
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-600">
                                    ?
                                </span>
                            </span>
                        </span>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Intervallo slot</span>
                        <select
                            className="select select-bordered bg-white"
                            value={settings.slotIncrementMinutes}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    slotIncrementMinutes: Number(e.target.value) as 15 | 30 | 60,
                                }))
                            }
                        >
                            <option value={15}>15 minuti</option>
                            <option value={30}>30 minuti</option>
                            <option value={60}>60 minuti</option>
                        </select>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Buffer predefinito (min)</span>
                        <input
                            type="number"
                            className="input input-bordered bg-white"
                            min={0}
                            max={60}
                            value={settings.defaultBufferBetweenAppointments}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    defaultBufferBetweenAppointments: Number(e.target.value),
                                }))
                            }
                        />
                    </label>
                </div>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                    Salva impostazioni
                </button>
            </form>

            {message && <p className="text-sm text-gray-600">{message}</p>}
        </section>
    )
}
