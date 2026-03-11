'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg } from '@fullcalendar/core'
import type { EventInput } from '@fullcalendar/core/index.js'
import { DEFAULT_STUDIO_TIMEZONE } from '@/lib/date-timezone'

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

type CalendarEvent = EventInput & {
    type?: 'appointment' | 'external' | 'blocker'
    status?: string
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
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [eventsLoading, setEventsLoading] = useState(false)
    const [studioTimezone, setStudioTimezone] = useState(DEFAULT_STUDIO_TIMEZONE)

    const loadCalendarEvents = useCallback(async () => {
        setEventsLoading(true)
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/calendar-events`, {
                credentials: 'include',
                headers: authHeaders,
            })

            if (!res.ok) {
                const error = await res.json()
                setMessage(error.error || 'Errore nel caricamento eventi calendario')
                return
            }

            const data = await res.json()
            setEvents(data.events || [])
        } finally {
            setEventsLoading(false)
        }
    }, [studioId])

    useEffect(() => {
        async function loadStatusAndTimezone() {
            const authHeaders = await getAuthHeaders()
            const [statusRes, studioRes] = await Promise.all([
                fetch(`/api/studios/${studioId}/google-calendar`, {
                    credentials: 'include',
                    headers: authHeaders,
                }),
                fetch(`/api/studios/${studioId}`, {
                    credentials: 'include',
                    headers: authHeaders,
                }),
            ])

            if (statusRes.ok) {
                const data = await statusRes.json()
                setStatus(data)
                setSelectedCalendarId(data.selectedCalendar?.id || '')
            }

            if (studioRes.ok) {
                const studioData = await studioRes.json()
                setStudioTimezone(studioData.timezone || DEFAULT_STUDIO_TIMEZONE)
            }
            setLoading(false)
        }

        loadStatusAndTimezone()
        loadCalendarEvents()
    }, [studioId, loadCalendarEvents])

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
            await loadCalendarEvents()
        } finally {
            setWorking(false)
        }
    }

    const handleCreateManualBlocker = async (selection: DateSelectArg) => {
        const confirmed = confirm('Vuoi marcare questo slot come "Occupato personale"?')
        if (!confirmed) {
            return
        }

        setWorking(true)
        setMessage('')
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/external-blockers`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    startTime: selection.startStr,
                    endTime: selection.endStr,
                    summary: 'Occupato personale',
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile creare il blocco orario')
                return
            }

            setMessage('Slot marcato come occupato personale.')
            await loadCalendarEvents()
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
        return <div className="glass-widget rounded-2xl p-6">Caricamento impostazioni calendario...</div>
    }

    return (
        <section className="space-y-5 glass-widget rounded-2xl p-6">
            <div>
                <h1 className="text-2xl font-bold text-base-content">Google Calendar</h1>
                <p className="mt-1 text-sm text-secondary">Connetti, seleziona il calendario, sincronizza e disconnetti.</p>
            </div>

            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm text-base-content">
                    Stato: <span className="font-semibold">{status?.connected ? 'Connesso' : 'Disconnesso'}</span>
                </p>
                {status?.selectedCalendar && (
                    <p className="mt-2 text-sm text-secondary">
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
                            <span className="label-text mb-1 block text-sm text-secondary">Calendario da sincronizzare</span>
                            <select
                                className="select select-bordered w-full"
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
                <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm text-secondary">
                    {message}
                </div>
            )}

            <div className="rounded-xl border border-base-300 bg-base-100 p-2">
                <div className="mb-3 flex items-center justify-between px-2">
                    <p className="text-sm text-secondary">
                        Vista unificata appuntamenti e impegni esterni. Seleziona uno slot per marcarlo come occupato personale.
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-secondary">Fuso: {studioTimezone}</span>
                        {eventsLoading && <span className="text-xs text-secondary">Aggiornamento...</span>}
                    </div>
                </div>

                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    buttonText={{
                        today: 'Oggi',
                        month: 'Mese',
                        week: 'Settimana',
                        day: 'Giorno',
                    }}
                    locale="it"
                    timeZone={studioTimezone}
                    selectable
                    selectMirror
                    select={handleCreateManualBlocker}
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"
                    allDaySlot={false}
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
                    events={events}
                    height="auto"
                />
            </div>
        </section>
    )
}
