'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    BuildingOffice2Icon, MapPinIcon, PhoneIcon, GlobeAltIcon,
    CalendarDaysIcon, PencilSquareIcon, ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/hooks/useAuth'
import { type ProfessionalStudio, MEDICAL_ROLES } from '@/lib/types'
import { supabase as supabaseBrowser } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { useToast } from '@/lib/toast-context'

export default function StudioDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { showToast } = useToast()

    const studioId = params.id as string

    const [studio, setStudio] = useState<ProfessionalStudio | null>(null)
    const [loading, setLoading] = useState(true)

    // Stato prenotazione
    const [showBookingForm, setShowBookingForm] = useState(false)
    const [bookingData, setBookingData] = useState({
        startTime: '',
        endTime: '',
        serviceType: '',
        notes: '',
    })
    const [bookingLoading, setBookingLoading] = useState(false)

    useEffect(() => {
        fetch(`/api/studios/${studioId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { router.replace('/studios'); return }
                setStudio(data)
            })
            .catch(() => router.replace('/studios'))
            .finally(() => setLoading(false))
    }, [studioId, router])

    const isOwner = user && studio && String(user.id) === String(studio.ownerId)

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bookingData.startTime || !bookingData.endTime) {
            showToast('error', 'Campi obbligatori', 'Inserisci data e ora')
            return
        }
        setBookingLoading(true)
        try {
            const { data: { session } } = await supabaseBrowser.auth.getSession()
            if (!session) { router.push('/login'); return }

            const res = await fetch(`/api/studios/${studioId}/appointments`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify(bookingData),
            })
            const data = await res.json()
            if (!res.ok) {
                showToast('error', 'Errore', data.error || 'Impossibile prenotare')
                return
            }
            showToast('success', 'Prenotazione inviata!', 'Attendi la conferma del professionista')
            setShowBookingForm(false)
            setBookingData({ startTime: '', endTime: '', serviceType: '', notes: '' })
        } catch {
            showToast('error', 'Errore', 'Si è verificato un errore imprevisto')
        } finally {
            setBookingLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
        )
    }

    if (!studio) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8 pb-12">
                {/* Scheda principale */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-sm">
                                {studio.logoUrl ? (
                                    <img src={studio.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <BuildingOffice2Icon className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{studio.name}</h1>
                                {studio.owner && (
                                    <Link href={`/profile/${studio.owner.id}`} className="text-green-600 hover:text-green-700 font-medium text-sm">
                                        {studio.owner.firstName} {studio.owner.lastName}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Azioni */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isOwner && (
                                <>
                                    <Link
                                        href={`/studios/${studioId}/dashboard`}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition"
                                    >
                                        <ChartBarIcon className="h-4 w-4" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={`/studios/${studioId}/dashboard?tab=edit`}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Modifica
                                    </Link>
                                </>
                            )}
                            {user && !isOwner && (
                                <button
                                    onClick={() => setShowBookingForm(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                >
                                    <CalendarDaysIcon className="h-5 w-5" />
                                    Prenota Visita
                                </button>
                            )}
                            {!user && (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                >
                                    <CalendarDaysIcon className="h-5 w-5" />
                                    Accedi per prenotare
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Info contatti */}
                    <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-gray-100">
                        {studio.city && (
                            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                <MapPinIcon className="h-4 w-4 text-gray-400" />
                                {studio.address ? `${studio.address}, ${studio.city}` : studio.city}
                            </div>
                        )}
                        {studio.phone && (
                            <a href={`tel:${studio.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-green-600 text-sm transition">
                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                {studio.phone}
                            </a>
                        )}
                        {studio.website && (
                            <a href={studio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-green-600 text-sm transition">
                                <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                                Sito web
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Descrizione */}
                    <div className="md:col-span-2 space-y-6">
                        {studio.description && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-3">Chi siamo</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{studio.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Servizi */}
                    {studio.servicesOffered.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="font-bold text-gray-900 mb-3">Servizi</h2>
                            <ul className="space-y-2">
                                {studio.servicesOffered.map((s, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal prenotazione */}
            {showBookingForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Prenota una visita</h2>
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data e ora inizio <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={bookingData.startTime}
                                    onChange={e => setBookingData(p => ({ ...p, startTime: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data e ora fine <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={bookingData.endTime}
                                    onChange={e => setBookingData(p => ({ ...p, endTime: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo di servizio</label>
                                {studio.servicesOffered.length > 0 ? (
                                    <select
                                        value={bookingData.serviceType}
                                        onChange={e => setBookingData(p => ({ ...p, serviceType: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="">Seleziona servizio...</option>
                                        {studio.servicesOffered.map((s, i) => (
                                            <option key={i} value={s}>{s}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={bookingData.serviceType}
                                        onChange={e => setBookingData(p => ({ ...p, serviceType: e.target.value }))}
                                        placeholder="Es: Fisioterapia, Consulenza..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                <textarea
                                    value={bookingData.notes}
                                    onChange={e => setBookingData(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Descrivi brevemente il motivo della visita..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingForm(false)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-60"
                                >
                                    {bookingLoading ? 'Invio...' : 'Invia richiesta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
