'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type Appointment = {
    id: string
    startTime: string
    endTime: string
    status: string
}

type Studio = {
    name: string
}

export default function StudioDashboardOverviewPage() {
    const params = useParams()
    const studioId = params.id as string

    const [studio, setStudio] = useState<Studio | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [calendarConnected, setCalendarConnected] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const authHeaders = await getAuthHeaders()
                const [studioRes, apptRes, calRes] = await Promise.all([
                    fetch(`/api/studios/${studioId}`),
                    fetch(`/api/studios/${studioId}/appointments`, {
                        credentials: 'include',
                        headers: authHeaders,
                    }),
                    fetch(`/api/studios/${studioId}/google-calendar`, {
                        credentials: 'include',
                        headers: authHeaders,
                    }),
                ])

                if (studioRes.ok) setStudio(await studioRes.json())
                if (apptRes.ok) setAppointments(await apptRes.json())
                if (calRes.ok) {
                    const calData = await calRes.json()
                    setCalendarConnected(Boolean(calData.connected))
                }
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [studioId])

    const metrics = useMemo(() => {
        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(todayStart)
        weekEnd.setDate(todayStart.getDate() + 7)

        const monthEnd = new Date(todayStart)
        monthEnd.setMonth(todayStart.getMonth() + 1)

        const today = appointments.filter((a) => {
            const d = new Date(a.startTime)
            return d >= todayStart && d < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        }).length

        const week = appointments.filter((a) => {
            const d = new Date(a.startTime)
            return d >= todayStart && d < weekEnd
        }).length

        const month = appointments.filter((a) => {
            const d = new Date(a.startTime)
            return d >= todayStart && d < monthEnd
        }).length

        const pending = appointments.filter((a) => a.status === 'pending').length

        return { today, week, month, pending }
    }, [appointments])

    if (loading) {
        return <div className="glass-widget rounded-2xl p-6">Caricamento panoramica...</div>
    }

    return (
        <section className="space-y-6">
            <header className="glass-widget rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-base-content">{studio?.name || 'Studio'}</h1>
                <p className="mt-1 text-sm text-secondary">Panoramica operativa della settimana</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Oggi" value={metrics.today} />
                <MetricCard label="Prossimi 7 giorni" value={metrics.week} />
                <MetricCard label="Prossimi 30 giorni" value={metrics.month} />
                <MetricCard label="In attesa" value={metrics.pending} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="glass-widget rounded-2xl p-5">
                    <p className="text-sm font-semibold text-base-content">Google Calendar</p>
                    <p className="mt-2 text-sm text-secondary">
                        Stato connessione: {calendarConnected ? 'Connesso' : 'Non connesso'}
                    </p>
                    <Link
                        href={`/studios/${studioId}/dashboard/calendar`}
                        className="btn btn-primary btn-sm mt-4"
                    >
                        Gestisci connessione
                    </Link>
                </div>

                <div className="glass-widget rounded-2xl p-5">
                    <p className="text-sm font-semibold text-base-content">Azioni rapide</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={`/studios/${studioId}/dashboard/bookings`}
                            className="btn btn-primary btn-sm rounded-full"
                        >
                            Gestisci prenotazioni
                        </Link>
                        <Link
                            href={`/studios/${studioId}/dashboard/availability`}
                            className="btn btn-outline btn-primary btn-sm rounded-full"
                        >
                            Modifica disponibilità
                        </Link>
                        <Link
                            href={`/studios/${studioId}/dashboard/services`}
                            className="btn btn-outline btn-primary btn-sm rounded-full"
                        >
                            Catalogo servizi
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="glass-widget rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-bold text-base-content">{value}</p>
        </div>
    )
}
