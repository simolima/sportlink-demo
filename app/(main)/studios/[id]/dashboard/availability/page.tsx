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
                setMessage(data.error || 'Unable to save schedule')
                return
            }
            setMessage('Availability rules saved successfully.')
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
                setMessage(data.error || 'Unable to create blackout period')
                return
            }

            setBlackouts((prev) => [...prev, data])
            setNewBlackout({ startDate: '', endDate: '', reason: '' })
            setMessage('Blackout period created.')
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
                setMessage(data.error || 'Unable to delete blackout period')
                return
            }

            setBlackouts((prev) => prev.filter((b) => b.id !== blackoutId))
            setMessage('Blackout period deleted.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-base-300 bg-base-200 p-6">Loading availability...</div>
    }

    return (
        <section className="space-y-6 rounded-2xl border border-base-300 bg-base-200 p-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Availability</h1>
                <p className="mt-1 text-sm text-secondary/70">Manage weekly work hours and blackout dates.</p>
            </div>

            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <label className="mb-2 block text-sm font-semibold">Timezone</label>
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
                <p className="text-sm font-semibold">Weekly schedule</p>
                {DAYS.map((day) => (
                    <div key={day} className="rounded-lg border border-base-300 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{day}</p>
                            <button className="btn btn-xs btn-ghost" onClick={() => addRange(day)}>
                                Add range
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(weeklySchedule[day] || []).map((range, index) => (
                                <div key={`${day}-${index}`} className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                                    <input
                                        type="time"
                                        className="input input-bordered"
                                        value={range.start}
                                        onChange={(e) => updateRange(day, index, 'start', e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        className="input input-bordered"
                                        value={range.end}
                                        onChange={(e) => updateRange(day, index, 'end', e.target.value)}
                                    />
                                    <button className="btn btn-xs btn-error btn-outline" onClick={() => removeRange(day, index)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {(weeklySchedule[day] || []).length === 0 && (
                                <p className="text-xs text-secondary/60">No ranges configured.</p>
                            )}
                        </div>
                    </div>
                ))}

                <button className="btn btn-primary" onClick={saveSchedule} disabled={saving}>
                    Save availability
                </button>
            </div>

            <div className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-semibold">Blackout dates</p>
                <div className="grid gap-2 md:grid-cols-4">
                    <input
                        type="date"
                        className="input input-bordered"
                        value={newBlackout.startDate}
                        onChange={(e) => setNewBlackout((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                    <input
                        type="date"
                        className="input input-bordered"
                        value={newBlackout.endDate}
                        onChange={(e) => setNewBlackout((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                    <input
                        type="text"
                        className="input input-bordered"
                        placeholder="Reason (optional)"
                        value={newBlackout.reason}
                        onChange={(e) => setNewBlackout((prev) => ({ ...prev, reason: e.target.value }))}
                    />
                    <button className="btn btn-primary" onClick={createBlackout} disabled={saving}>
                        Add blackout
                    </button>
                </div>

                <div className="space-y-2">
                    {blackouts.length === 0 && <p className="text-sm text-secondary/70">No blackout dates yet.</p>}
                    {blackouts.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-base-300 px-3 py-2">
                            <div>
                                <p className="text-sm font-medium">{item.start_date} - {item.end_date}</p>
                                {item.reason && <p className="text-xs text-secondary/70">{item.reason}</p>}
                            </div>
                            <button className="btn btn-xs btn-error btn-outline" onClick={() => deleteBlackout(item.id)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {message && <p className="text-sm text-secondary/80">{message}</p>}
        </section>
    )
}
