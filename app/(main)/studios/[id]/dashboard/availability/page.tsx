'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type TimeRange = { start: string; end: string }
type WeeklySchedule = Record<string, TimeRange[]>
type BlackoutDate = {
    id: string
    start_date: string
    end_date: string
    reason: string | null
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TIMEZONES = ['Europe/Rome', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles']
const DAY_LABELS: Record<string, string> = {
    monday: 'Lunedi',
    tuesday: 'Martedi',
    wednesday: 'Mercoledi',
    thursday: 'Giovedi',
    friday: 'Venerdi',
    saturday: 'Sabato',
    sunday: 'Domenica',
}

export default function StudioDashboardAvailabilityPage() {
    const params = useParams()
    const studioId = params.id as string

    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({})
    const [timezone, setTimezone] = useState('Europe/Rome')
    const [blackouts, setBlackouts] = useState<BlackoutDate[]>([])
    const [newBlackout, setNewBlackout] = useState({ startDate: '', endDate: '', reason: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function loadData() {
            const [availabilityRes, blackoutRes] = await Promise.all([
                fetch(`/api/studios/${studioId}/availability`),
                fetch(`/api/studios/${studioId}/blackout-dates`),
            ])

            if (availabilityRes.ok) {
                const data = await availabilityRes.json()
                setWeeklySchedule(data.weeklySchedule || {})
                setTimezone(data.timezone || 'Europe/Rome')
            }

            if (blackoutRes.ok) {
                setBlackouts(await blackoutRes.json())
            }

            setLoading(false)
        }

        loadData()
    }, [studioId])

    const addRange = (day: string) => {
        setWeeklySchedule((prev) => ({
            ...prev,
            [day]: [...(prev[day] || []), { start: '09:00', end: '13:00' }],
        }))
    }

    const updateRange = (day: string, index: number, field: 'start' | 'end', value: string) => {
        setWeeklySchedule((prev) => ({
            ...prev,
            [day]: (prev[day] || []).map((range, idx) =>
                idx === index ? { ...range, [field]: value } : range
            ),
        }))
    }

    const removeRange = (day: string, index: number) => {
        setWeeklySchedule((prev) => ({
            ...prev,
            [day]: (prev[day] || []).filter((_, idx) => idx !== index),
        }))
    }

    const saveSchedule = async () => {
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/availability`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ weeklySchedule, timezone }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile salvare la disponibilità')
                return
            }
            setMessage('Disponibilità salvata con successo.')
        } finally {
            setSaving(false)
        }
    }

    const createBlackout = async () => {
        if (!newBlackout.startDate || !newBlackout.endDate) return

        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/blackout-dates`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify(newBlackout),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile creare il periodo di indisponibilità')
                return
            }

            setBlackouts((prev) => [...prev, data])
            setNewBlackout({ startDate: '', endDate: '', reason: '' })
            setMessage('Periodo di indisponibilità creato.')
        } finally {
            setSaving(false)
        }
    }

    const deleteBlackout = async (blackoutId: string) => {
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/blackout-dates/${blackoutId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders,
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile eliminare il periodo di indisponibilità')
                return
            }

            setBlackouts((prev) => prev.filter((b) => b.id !== blackoutId))
            setMessage('Periodo di indisponibilità eliminato.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="glass-widget rounded-2xl p-6">Caricamento disponibilità...</div>
    }

    return (
        <section className="space-y-6 glass-widget rounded-2xl p-6">
            <div>
                <h1 className="text-2xl font-bold text-base-content">Disponibilità</h1>
                <p className="mt-1 text-sm text-secondary">Gestisci orari settimanali e periodi di indisponibilità.</p>
            </div>

            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <label className="mb-2 block text-sm font-semibold text-base-content">Fuso orario</label>
                <select
                    className="select select-bordered w-full max-w-sm"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                >
                    {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-semibold text-base-content">Programmazione settimanale</p>
                {DAYS.map((day) => (
                    <div key={day} className="rounded-lg border border-base-300 bg-base-100 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-base-content">{DAY_LABELS[day]}</p>
                            <button
                                className="btn btn-outline btn-primary btn-xs rounded-full"
                                onClick={() => addRange(day)}
                                type="button"
                            >
                                <span className="text-sm leading-none">+</span>
                                <span>Aggiungi fascia</span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(weeklySchedule[day] || []).map((range, index) => (
                                <div key={`${day}-${index}`} className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                                    <label className="form-control">
                                        <span className="label-text mb-1 block text-xs text-secondary">Da</span>
                                        <input
                                            type="time"
                                            className="input input-bordered"
                                            value={range.start}
                                            onChange={(e) => updateRange(day, index, 'start', e.target.value)}
                                        />
                                    </label>
                                    <label className="form-control">
                                        <span className="label-text mb-1 block text-xs text-secondary">A</span>
                                        <input
                                            type="time"
                                            className="input input-bordered"
                                            value={range.end}
                                            onChange={(e) => updateRange(day, index, 'end', e.target.value)}
                                        />
                                    </label>
                                    <button className="btn btn-xs btn-error btn-outline" onClick={() => removeRange(day, index)}>
                                        Rimuovi
                                    </button>
                                </div>
                            ))}
                            {(weeklySchedule[day] || []).length === 0 && (
                                <p className="text-xs text-secondary">Nessuna fascia configurata.</p>
                            )}
                        </div>
                    </div>
                ))}

                <button className="btn btn-primary" onClick={saveSchedule} disabled={saving}>
                    Salva disponibilità
                </button>
            </div>

            <div className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-semibold text-base-content">Periodi di indisponibilità</p>
                <div className="grid gap-2 md:grid-cols-4">
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Data inizio</span>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={newBlackout.startDate}
                            onChange={(e) => setNewBlackout((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Data fine</span>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={newBlackout.endDate}
                            onChange={(e) => setNewBlackout((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Motivo</span>
                        <input
                            type="text"
                            className="input input-bordered"
                            placeholder="Motivo (opzionale)"
                            value={newBlackout.reason}
                            onChange={(e) => setNewBlackout((prev) => ({ ...prev, reason: e.target.value }))}
                        />
                    </label>
                    <div className="flex items-end">
                        <button className="btn btn-primary w-full" onClick={createBlackout} disabled={saving}>
                            Aggiungi indisponibilità
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {blackouts.length === 0 && <p className="text-sm text-secondary">Nessun periodo di indisponibilità.</p>}
                    {blackouts.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-base-300 bg-base-100 px-3 py-2">
                            <div>
                                <p className="text-sm font-medium text-base-content">{item.start_date} - {item.end_date}</p>
                                {item.reason && <p className="text-xs text-secondary">{item.reason}</p>}
                            </div>
                            <button className="btn btn-xs btn-error btn-outline" onClick={() => deleteBlackout(item.id)}>
                                Elimina
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {message && <p className="text-sm text-secondary">{message}</p>}
        </section>
    )
}
