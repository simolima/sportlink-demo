'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'

type Booking = {
    id: string
    startTime: string
    endTime: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    serviceType?: string
    notes?: string
    client?: {
        firstName?: string
        lastName?: string
    }
}

function toDateTimeLocalValue(isoString: string): string {
    const date = new Date(isoString)
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const
const STATUS_LABELS: Record<(typeof FILTERS)[number], string> = {
    all: 'Tutte',
    pending: 'In attesa',
    confirmed: 'Confermata',
    completed: 'Completata',
    cancelled: 'Annullata',
}

export default function StudioDashboardBookingsPage() {
    const params = useParams()
    const studioId = params.id as string

    const [bookings, setBookings] = useState<Booking[]>([])
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
    const [loading, setLoading] = useState(true)
    const [workingId, setWorkingId] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null)
    const [rescheduleStart, setRescheduleStart] = useState('')
    const [rescheduleEnd, setRescheduleEnd] = useState('')

    useEffect(() => {
        async function loadBookings() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointments`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                setBookings(await res.json())
            }
            setLoading(false)
        }

        loadBookings()
    }, [studioId])

    const visibleBookings = useMemo(() => {
        if (filter === 'all') return bookings
        return bookings.filter((booking) => booking.status === filter)
    }, [bookings, filter])

    const updateStatus = async (bookingId: string, status: Booking['status']) => {
        setWorkingId(bookingId)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointments/${bookingId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ status }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile aggiornare lo stato della prenotazione')
                return
            }

            setBookings((prev) => prev.map((item) => (item.id === bookingId ? { ...item, status: data.status } : item)))
        } finally {
            setWorkingId(null)
        }
    }

    const openRescheduleModal = (booking: Booking) => {
        setRescheduleTarget(booking)
        setRescheduleStart(toDateTimeLocalValue(booking.startTime))
        setRescheduleEnd(toDateTimeLocalValue(booking.endTime))
    }

    const handleReschedule = async () => {
        if (!rescheduleTarget) return
        if (!rescheduleStart || !rescheduleEnd) {
            setMessage('Inserisci data e ora di inizio/fine per riprogrammare.')
            return
        }

        setWorkingId(rescheduleTarget.id)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointments/${rescheduleTarget.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    startTime: new Date(rescheduleStart).toISOString(),
                    endTime: new Date(rescheduleEnd).toISOString(),
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile riprogrammare la prenotazione')
                return
            }

            setBookings((prev) => prev.map((item) => (
                item.id === rescheduleTarget.id
                    ? { ...item, startTime: data.startTime, endTime: data.endTime }
                    : item
            )))

            setRescheduleTarget(null)
            setMessage('Prenotazione riprogrammata con successo.')
        } finally {
            setWorkingId(null)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento prenotazioni...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Prenotazioni</h1>
                <p className="mt-1 text-sm text-gray-600">Controlla e aggiorna lo stato degli appuntamenti.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((status) => (
                    <button
                        key={status}
                        className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(status)}
                    >
                        {STATUS_LABELS[status]}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {visibleBookings.length === 0 && (
                    <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        Nessuna prenotazione per questo filtro.
                    </p>
                )}

                {visibleBookings.map((booking) => (
                    <div key={booking.id} className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr,auto]">
                        <div>
                            <p className="font-semibold text-gray-900">
                                {booking.client?.firstName || 'Cliente'} {booking.client?.lastName || ''}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {new Date(booking.startTime).toLocaleString('it-IT')} - {new Date(booking.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {booking.serviceType && <p className="text-sm text-gray-600">Servizio: {booking.serviceType}</p>}
                            {booking.notes && <p className="text-xs text-gray-500">{booking.notes}</p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-ghost">{STATUS_LABELS[booking.status]}</span>
                            {booking.status === 'pending' && (
                                <>
                                    <button className="btn btn-xs btn-info" onClick={() => updateStatus(booking.id, 'confirmed')} disabled={workingId === booking.id}>
                                        Conferma
                                    </button>
                                    <button className="btn btn-xs btn-error btn-outline" onClick={() => updateStatus(booking.id, 'cancelled')} disabled={workingId === booking.id}>
                                        Annulla
                                    </button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <>
                                    <button className="btn btn-xs btn-info" onClick={() => updateStatus(booking.id, 'completed')} disabled={workingId === booking.id}>
                                        Completa
                                    </button>
                                    <button className="btn btn-xs btn-outline" onClick={() => openRescheduleModal(booking)} disabled={workingId === booking.id}>
                                        Riprogramma
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {message && <p className="text-sm text-gray-600">{message}</p>}

            {rescheduleTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Riprogramma prenotazione</h3>
                        <p className="mt-1 text-sm text-gray-600">Seleziona nuovo orario per l'appuntamento confermato.</p>

                        <div className="mt-4 space-y-3">
                            <label className="block text-sm">
                                <span className="mb-1 block text-gray-600">Inizio</span>
                                <input
                                    type="datetime-local"
                                    value={rescheduleStart}
                                    onChange={(e) => setRescheduleStart(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                                />
                            </label>

                            <label className="block text-sm">
                                <span className="mb-1 block text-gray-600">Fine</span>
                                <input
                                    type="datetime-local"
                                    value={rescheduleEnd}
                                    onChange={(e) => setRescheduleEnd(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                className="btn btn-ghost flex-1"
                                onClick={() => setRescheduleTarget(null)}
                                disabled={workingId === rescheduleTarget.id}
                            >
                                Annulla
                            </button>
                            <button
                                className="btn btn-primary flex-1"
                                onClick={handleReschedule}
                                disabled={workingId === rescheduleTarget.id}
                            >
                                Salva orario
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
