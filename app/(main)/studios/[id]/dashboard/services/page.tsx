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
                setMessage(data.error || 'Unable to create service')
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
            setMessage('Service created.')
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
                setMessage(data.error || 'Unable to update service')
                return
            }

            setServices((prev) => prev.map((item) => (item.id === service.id ? data : item)))
        } finally {
            setSaving(false)
        }
    }

    const deleteService = async (serviceId: string) => {
        if (!confirm('Delete this service?')) return

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
                setMessage(data.error || 'Unable to delete service')
                return
            }

            setServices((prev) => prev.filter((service) => service.id !== serviceId))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-base-300 bg-base-200 p-6">Loading services...</div>
    }

    return (
        <section className="space-y-6 rounded-2xl border border-base-300 bg-base-200 p-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Services</h1>
                <p className="mt-1 text-sm text-secondary/70">Manage appointment types and booking options.</p>
            </div>

            <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-2">
                <input
                    className="input input-bordered"
                    placeholder="Service name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                />
                <input
                    className="input input-bordered"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <input
                    type="number"
                    className="input input-bordered"
                    min={15}
                    max={480}
                    placeholder="Duration (minutes)"
                    value={form.durationMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                />
                <input
                    type="number"
                    className="input input-bordered"
                    min={0}
                    max={60}
                    placeholder="Buffer before (minutes)"
                    value={form.bufferBeforeMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, bufferBeforeMinutes: Number(e.target.value) }))}
                />
                <input
                    type="number"
                    className="input input-bordered"
                    min={0}
                    max={60}
                    placeholder="Buffer after (minutes)"
                    value={form.bufferAfterMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, bufferAfterMinutes: Number(e.target.value) }))}
                />
                <input
                    type="number"
                    className="input input-bordered"
                    min={0}
                    placeholder="Price (EUR)"
                    value={form.priceAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, priceAmount: e.target.value }))}
                />
                <input
                    type="text"
                    className="input input-bordered"
                    placeholder="#2341F0"
                    value={form.colorHex}
                    onChange={(e) => setForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                />
                <button className="btn btn-primary md:col-span-2" type="submit" disabled={saving}>
                    Create service
                </button>
            </form>

            <div className="space-y-2">
                {services.length === 0 && <p className="text-sm text-secondary/70">No services created yet.</p>}
                {services.map((service) => (
                    <div key={service.id} className="grid gap-2 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-[1fr,auto]">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: service.color_hex }} />
                                <p className="font-semibold text-secondary">{service.name}</p>
                                <span className={`badge ${service.is_active ? 'badge-info' : 'badge-ghost'}`}>
                                    {service.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-secondary/70">
                                {service.duration_minutes} min | buffer {service.buffer_before_minutes}/{service.buffer_after_minutes} min
                            </p>
                            {service.price_amount !== null && (
                                <p className="text-sm text-secondary/70">Price: {service.price_amount} EUR</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="btn btn-xs btn-ghost" onClick={() => toggleActive(service)} disabled={saving}>
                                {service.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn btn-xs btn-error btn-outline" onClick={() => deleteService(service.id)} disabled={saving}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {message && <p className="text-sm text-secondary/80">{message}</p>}
        </section>
    )
}
