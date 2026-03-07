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

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const

export default function StudioDashboardBookingsPage() {
    const params = useParams()
    const studioId = params.id as string

    const [bookings, setBookings] = useState<Booking[]>([])
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
    const [loading, setLoading] = useState(true)
    const [workingId, setWorkingId] = useState<string | null>(null)
    const [message, setMessage] = useState('')

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
                setMessage(data.error || 'Unable to update booking status')
                return
            }

            setBookings((prev) => prev.map((item) => (item.id === bookingId ? { ...item, status: data.status } : item)))
        } finally {
            setWorkingId(null)
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-base-300 bg-base-200 p-6">Loading bookings...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-base-300 bg-base-200 p-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Bookings</h1>
                <p className="mt-1 text-sm text-secondary/70">Review and update appointment status.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((status) => (
                    <button
                        key={status}
                        className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {visibleBookings.length === 0 && (
                    <p className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm text-secondary/70">
                        No bookings for this filter.
                    </p>
                )}

                {visibleBookings.map((booking) => (
                    <div key={booking.id} className="grid gap-3 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-[1fr,auto]">
                        <div>
                            <p className="font-semibold text-secondary">
                                {booking.client?.firstName || 'Client'} {booking.client?.lastName || ''}
                            </p>
                            <p className="mt-1 text-sm text-secondary/70">
                                {new Date(booking.startTime).toLocaleString('it-IT')} - {new Date(booking.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {booking.serviceType && <p className="text-sm text-secondary/70">Service: {booking.serviceType}</p>}
                            {booking.notes && <p className="text-xs text-secondary/60">{booking.notes}</p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-ghost">{booking.status}</span>
                            {booking.status === 'pending' && (
                                <>
                                    <button className="btn btn-xs btn-info" onClick={() => updateStatus(booking.id, 'confirmed')} disabled={workingId === booking.id}>
                                        Confirm
                                    </button>
                                    <button className="btn btn-xs btn-error btn-outline" onClick={() => updateStatus(booking.id, 'cancelled')} disabled={workingId === booking.id}>
                                        Cancel
                                    </button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <button className="btn btn-xs btn-info" onClick={() => updateStatus(booking.id, 'completed')} disabled={workingId === booking.id}>
                                    Complete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {message && <p className="text-sm text-secondary/80">{message}</p>}
        </section>
    )
}
