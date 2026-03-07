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
                setMessage(data.error || 'Unable to save studio settings')
                return
            }

            setMessage('Settings saved successfully.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-base-300 bg-base-200 p-6">Loading settings...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-base-300 bg-base-200 p-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Settings</h1>
                <p className="mt-1 text-sm text-secondary/70">Studio profile and booking configuration.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                    <input
                        className="input input-bordered"
                        placeholder="Studio name"
                        value={settings.name}
                        onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <input
                        className="input input-bordered"
                        placeholder="City"
                        value={settings.city}
                        onChange={(e) => setSettings((prev) => ({ ...prev, city: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-secondary/80">Address</label>
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
                    <input
                        className="input input-bordered"
                        placeholder="Phone"
                        value={settings.phone}
                        onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                    <input
                        className="input input-bordered"
                        placeholder="Website"
                        value={settings.website}
                        onChange={(e) => setSettings((prev) => ({ ...prev, website: e.target.value }))}
                    />
                </div>

                <textarea
                    className="textarea textarea-bordered w-full"
                    rows={4}
                    placeholder="Description"
                    value={settings.description}
                    onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                />

                <div className="grid gap-3 rounded-lg border border-base-300 p-3 md:grid-cols-2">
                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.bookingEnabled}
                            onChange={(e) => setSettings((prev) => ({ ...prev, bookingEnabled: e.target.checked }))}
                        />
                        <span className="label-text">Enable online booking</span>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.autoConfirmBookings}
                            onChange={(e) => setSettings((prev) => ({ ...prev, autoConfirmBookings: e.target.checked }))}
                        />
                        <span className="label-text">Auto-confirm bookings</span>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary/80">Slot increment</span>
                        <select
                            className="select select-bordered"
                            value={settings.slotIncrementMinutes}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    slotIncrementMinutes: Number(e.target.value) as 15 | 30 | 60,
                                }))
                            }
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>60 minutes</option>
                        </select>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary/80">Default buffer (min)</span>
                        <input
                            type="number"
                            className="input input-bordered"
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
                    Save settings
                </button>
            </form>

            {message && <p className="text-sm text-secondary/80">{message}</p>}
        </section>
    )
}
