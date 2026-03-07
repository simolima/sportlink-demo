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
            
            console.log('📅 Fetching Google calendars...')
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/google-calendars`, {
                credentials: 'include',
                headers: authHeaders,
            })
            
            if (res.ok) {
                const data = await res.json()
                console.log('✅ Calendars loaded:', data.calendars)
                setCalendars(data.calendars || [])
            } else {
                const error = await res.json()
                console.error('❌ Failed to load calendars:', error)
                setMessage(`Errore nel caricamento calendari: ${error.error || 'Errore sconosciuto'}`)
            }
        }

        loadCalendars()
    }, [status?.connected, studioId])

    useEffect(() => {
        if (searchParams.get('connected') === 'true') {
            setMessage('Google Calendar connesso con successo.')
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
                setMessage(data.error || 'Impossibile avviare il flusso OAuth')
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
                setMessage(data.error || 'Impossibile salvare il calendario selezionato')
                return
            }
            setMessage('Calendario selezionato e configurazione del canale di watch richiesta.')
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
                setMessage(data.error || 'Sincronizzazione manuale non riuscita')
                return
            }
            setMessage(`Sincronizzazione completata: +${data.result.added} ~${data.result.updated} -${data.result.deleted}`)
        } finally {
            setWorking(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Disconnettere Google Calendar?')) return

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
                setMessage(data.error || 'Disconnessione non riuscita')
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
            setMessage('Disconnesso con successo.')
        } finally {
            setWorking(false)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento impostazioni calendario...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Google Calendar</h1>
                <p className="mt-1 text-sm text-gray-600">Connetti, seleziona il calendario, sincronizza e disconnetti.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-900">
                    Stato: <span className="font-semibold">{status?.connected ? 'Connesso' : 'Disconnesso'}</span>
                </p>
                {status?.selectedCalendar && (
                    <p className="mt-2 text-sm text-gray-600">
                        Calendario selezionato: {status.selectedCalendar.name}
                    </p>
                )}
            </div>

            {!status?.connected ? (
                <button className="btn btn-primary" onClick={handleConnect} disabled={working}>
                    Connetti Google Calendar
                </button>
            ) : (
                <>
                    <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                        <label className="form-control">
                            <span className="label-text mb-1 block text-sm text-gray-600">Calendario da sincronizzare</span>
                            <select
                                className="select select-bordered bg-white w-full"
                                value={selectedCalendarId}
                                onChange={(e) => setSelectedCalendarId(e.target.value)}
                            >
                                <option value="">Seleziona un calendario</option>
                                {calendars.map((calendar) => (
                                    <option key={calendar.id} value={calendar.id}>
                                        {calendar.summary}{calendar.primary ? ' (principale)' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button className="btn btn-primary" onClick={handleSaveCalendar} disabled={working || !selectedCalendarId}>
                            Salva calendario
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button className="btn btn-ghost" onClick={handleManualSync} disabled={working}>
                            Avvia sync manuale
                        </button>
                        <button className="btn btn-error btn-outline" onClick={handleDisconnect} disabled={working}>
                            Disconnetti
                        </button>
                    </div>
                </>
            )}

            {message && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    {message}
                </div>
            )}
        </section>
    )
}
