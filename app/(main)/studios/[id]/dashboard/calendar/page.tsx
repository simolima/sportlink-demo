'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type CalendarItem = {
    id: string
    summary: string
    primary: boolean
}

type ConnectionStatus = {
    connected: boolean
    selectedCalendar: { id: string; name: string } | null
    lastSynced: string | null
    watchChannelExpires: string | null
}

export default function StudioDashboardCalendarPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const studioId = params.id as string

    const [status, setStatus] = useState<ConnectionStatus | null>(null)
    const [calendars, setCalendars] = useState<CalendarItem[]>([])
    const [selectedCalendarId, setSelectedCalendarId] = useState('')
    const [loading, setLoading] = useState(true)
    const [working, setWorking] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function loadStatus() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-calendar`, {
                credentials: 'include',
                headers: authHeaders,
            })

            if (res.ok) {
                const data = await res.json()
                setStatus(data)
                setSelectedCalendarId(data.selectedCalendar?.id || '')
            }
            setLoading(false)
        }

        loadStatus()
    }, [studioId])

    useEffect(() => {
        async function loadCalendars() {
            if (!status?.connected) return
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-calendars`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                const data = await res.json()
                setCalendars(data.calendars || [])
            }
        }

        loadCalendars()
    }, [status?.connected, studioId])

    useEffect(() => {
        if (searchParams.get('connected') === 'true') {
            setMessage('Google Calendar connected successfully.')
        }
    }, [searchParams])

    const handleConnect = async () => {
        setWorking(true)
        setMessage('')
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-auth/initiate`, {
                credentials: 'include',
                headers: authHeaders,
            })
            const data = await res.json()
            if (!res.ok || !data.authUrl) {
                setMessage(data.error || 'Unable to start OAuth flow')
                return
            }
            window.location.href = data.authUrl
        } finally {
            setWorking(false)
        }
    }

    const handleSaveCalendar = async () => {
        if (!selectedCalendarId) return

        setWorking(true)
        setMessage('')

        try {
            const selected = calendars.find((c) => c.id === selectedCalendarId)
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-calendar`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    calendarId: selectedCalendarId,
                    calendarName: selected?.summary || selectedCalendarId,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Unable to save calendar selection')
                return
            }
            setMessage('Calendar selected and watch channel setup requested.')
            setStatus((prev) => prev ? {
                ...prev,
                selectedCalendar: data.selectedCalendar,
            } : prev)
        } finally {
            setWorking(false)
        }
    }

    const handleManualSync = async () => {
        setWorking(true)
        setMessage('')
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/sync-google`, {
                method: 'POST',
                credentials: 'include',
                headers: authHeaders,
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Manual sync failed')
                return
            }
            setMessage(`Sync completed: +${data.result.added} ~${data.result.updated} -${data.result.deleted}`)
        } finally {
            setWorking(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Disconnect Google Calendar?')) return

        setWorking(true)
        setMessage('')
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-calendar`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders,
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Disconnect failed')
                return
            }

            setStatus({
                connected: false,
                selectedCalendar: null,
                lastSynced: null,
                watchChannelExpires: null,
            })
            setCalendars([])
            setSelectedCalendarId('')
            setMessage('Disconnected successfully.')
        } finally {
            setWorking(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-base-300 bg-base-200 p-6">Loading calendar settings...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-base-300 bg-base-200 p-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Google Calendar</h1>
                <p className="mt-1 text-sm text-secondary/70">Connect, select calendar, sync, and disconnect.</p>
            </div>

            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm">
                    Status: <span className="font-semibold">{status?.connected ? 'Connected' : 'Disconnected'}</span>
                </p>
                {status?.selectedCalendar && (
                    <p className="mt-2 text-sm text-secondary/80">
                        Selected calendar: {status.selectedCalendar.name}
                    </p>
                )}
            </div>

            {!status?.connected ? (
                <button className="btn btn-primary" onClick={handleConnect} disabled={working}>
                    Connect Google Calendar
                </button>
            ) : (
                <>
                    <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                        <select
                            className="select select-bordered w-full"
                            value={selectedCalendarId}
                            onChange={(e) => setSelectedCalendarId(e.target.value)}
                        >
                            <option value="">Select a calendar</option>
                            {calendars.map((calendar) => (
                                <option key={calendar.id} value={calendar.id}>
                                    {calendar.summary}{calendar.primary ? ' (primary)' : ''}
                                </option>
                            ))}
                        </select>
                        <button className="btn btn-primary" onClick={handleSaveCalendar} disabled={working || !selectedCalendarId}>
                            Save Calendar
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button className="btn btn-ghost" onClick={handleManualSync} disabled={working}>
                            Run Manual Sync
                        </button>
                        <button className="btn btn-error btn-outline" onClick={handleDisconnect} disabled={working}>
                            Disconnect
                        </button>
                    </div>
                </>
            )}

            {message && (
                <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm text-secondary/80">
                    {message}
                </div>
            )}
        </section>
    )
}
