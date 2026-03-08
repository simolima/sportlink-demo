'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PencilSquareIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/hooks/useAuth'
import { MEDICAL_ROLES, type MedicalRole, type ProfessionalStudio } from '@/lib/types'
import { supabase as supabaseBrowser } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { useToast } from '@/lib/toast-context'
import { getStudioMockDataByRole } from '@/lib/studio-mock-data'
import StudioPublicHero from '@/components/studio-public/StudioPublicHero'
import StudioTrustBar from '@/components/studio-public/StudioTrustBar'
import StudioAboutSection from '@/components/studio-public/StudioAboutSection'
import StudioSpecializations from '@/components/studio-public/StudioSpecializations'
import StudioServicesSection from '@/components/studio-public/StudioServicesSection'
import StudioMethodology from '@/components/studio-public/StudioMethodology'
import StudioReviewsSection from '@/components/studio-public/StudioReviewsSection'
import StudioReviewForm from '@/components/studio/StudioReviewForm'
import StudioLocationContact from '@/components/studio-public/StudioLocationContact'
import StudioFaqSection from '@/components/studio-public/StudioFaqSection'
import StudioFinalCta from '@/components/studio-public/StudioFinalCta'

type AppointmentTypeOption = {
    id: string
    name: string
    durationMinutes: number
    bufferBeforeMinutes?: number
    bufferAfterMinutes?: number
}

type AvailableSlot = {
    startTime: string
    endTime: string
}

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
        appointmentTypeId: '',
        selectedDate: '',
        notes: '',
    })
    const [bookingLoading, setBookingLoading] = useState(false)
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeOption[]>([])
    const [availableByDay, setAvailableByDay] = useState<Record<string, AvailableSlot[]>>({})
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [firstAvailableLabel, setFirstAvailableLabel] = useState('')

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
            setBookingData({ startTime: '', endTime: '', serviceType: '', appointmentTypeId: '', selectedDate: '', notes: '' })
            setAvailableByDay({})
            setFirstAvailableLabel('')
        } catch {
            showToast('error', 'Errore', 'Si è verificato un errore imprevisto')
        } finally {
            setBookingLoading(false)
        }
    }

    const openBookingModal = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        setShowBookingForm(true)
        setBookingData({ startTime: '', endTime: '', serviceType: '', appointmentTypeId: '', selectedDate: '', notes: '' })
        setAvailableByDay({})
        setFirstAvailableLabel('')

        try {
            const res = await fetch(`/api/studios/${studioId}/appointment-types`)
            if (!res.ok) return
            const data = await res.json()
            const mapped = (data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                durationMinutes: item.duration_minutes,
                bufferBeforeMinutes: item.buffer_before_minutes,
                bufferAfterMinutes: item.buffer_after_minutes,
            }))
            setAppointmentTypes(mapped)
        } catch {
            setAppointmentTypes([])
        }
    }

    const loadSlotsForAppointmentType = async (appointmentTypeId: string) => {
        if (!appointmentTypeId) {
            setAvailableByDay({})
            setFirstAvailableLabel('')
            return
        }

        setSlotsLoading(true)
        try {
            const res = await fetch(`/api/studios/${studioId}/available-slots?appointmentTypeId=${appointmentTypeId}&daysAhead=14`)
            const data = await res.json()
            if (!res.ok) {
                showToast('error', 'Slot non disponibili', data.error || 'Impossibile caricare gli slot')
                setAvailableByDay({})
                setFirstAvailableLabel('')
                return
            }

            setAvailableByDay(data.byDay || {})

            if (data.firstAvailable?.date && data.firstAvailable?.slot?.startTime) {
                setFirstAvailableLabel(`${data.firstAvailable.date} alle ${data.firstAvailable.slot.startTime}`)
            } else {
                setFirstAvailableLabel('')
            }
        } finally {
            setSlotsLoading(false)
        }
    }

    const handleSelectSlot = (date: string, slot: AvailableSlot) => {
        const start = `${date}T${slot.startTime}:00`
        const end = `${date}T${slot.endTime}:00`
        setBookingData((prev) => ({
            ...prev,
            selectedDate: date,
            startTime: start,
            endTime: end,
        }))
    }

    if (loading) {
        return (
            <div className="glass-page-bg min-h-screen flex items-center justify-center">
                <div className="loading loading-spinner loading-lg text-primary" />
            </div>
        )
    }

    if (!studio) return null

    const roleLower = studio.owner?.roleId?.toLowerCase() as MedicalRole | undefined
    const baseMockData = roleLower && MEDICAL_ROLES.includes(roleLower)
        ? getStudioMockDataByRole(roleLower)
        : null

    // Progressively replace mock content with real DB content when available.
    const mergedMockData = baseMockData ? {
        ...baseMockData,
        // Professional profile fields from DB (with fallback to mock)
        yearsOfExperience: studio.yearsOfExperience ?? baseMockData.yearsOfExperience,
        languages: (studio.languages && studio.languages.length > 0) ? studio.languages : baseMockData.languages,
        workModes: (studio.workModes && studio.workModes.length > 0) ? studio.workModes : baseMockData.workModes,
        certifications: (studio.certifications && studio.certifications.length > 0) ? studio.certifications : baseMockData.certifications,
        methodology: studio.methodology || baseMockData.methodology,
        // Dynamic content from DB (with fallback to mock)
        reviews: (studio.reviews && studio.reviews.length > 0)
            ? studio.reviews.map(r => ({
                id: r.id,
                clientName: r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : 'Cliente verificato',
                rating: r.rating,
                text: r.comment,
                date: r.createdAt,
                verified: r.isVerified,
            }))
            : baseMockData.reviews,
        specializations: (studio.specializations && studio.specializations.length > 0)
            ? studio.specializations.map(s => ({
                name: s.name,
                description: s.description || '',
                icon: s.icon || '⭐',
            }))
            : baseMockData.specializations,
        faq: (studio.faqs && studio.faqs.length > 0)
            ? studio.faqs.map(f => ({
                question: f.question,
                answer: f.answer,
            }))
            : baseMockData.faq,
    } : null

    return (
        <div className="glass-page-bg min-h-screen">
            {/* Admin controls sticky bar */}
            {isOwner && (
                <div className="bg-base-100/90 backdrop-blur border-b border-base-300 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-secondary font-medium">Modalità Gestione Studio</span>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/studios/${studioId}/dashboard/overview`}
                                className="btn btn-primary btn-sm"
                            >
                                <ChartBarIcon className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href={`/studios/${studioId}/dashboard/settings`}
                                className="btn btn-ghost btn-sm"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Modifica
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <StudioPublicHero
                studio={studio}
                mockData={mergedMockData}
                onBookingClick={openBookingModal}
                onCallClick={studio.phone ? () => window.location.href = `tel:${studio.phone}` : undefined}
                isAuthenticated={!!user}
            />

            {/* Trust Bar */}
            {mergedMockData && <StudioTrustBar mockData={mergedMockData} />}

            {/* About Section */}
            <StudioAboutSection studio={studio} />

            {/* Specializations Grid */}
            {mergedMockData && <StudioSpecializations mockData={mergedMockData} />}

            {/* Services Section */}
            <StudioServicesSection studio={studio} />

            {/* Methodology Section */}
            {mergedMockData && <StudioMethodology mockData={mergedMockData} />}

            {/* Reviews Section */}
            {mergedMockData && (
                <div className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4 space-y-12">
                        <StudioReviewsSection mockData={mergedMockData} />
                        <StudioReviewForm
                            studioId={studioId}
                            onSuccess={() => {
                                // Reload studio data to refresh reviews
                                fetch(`/api/studios/${studioId}`)
                                    .then(r => r.json())
                                    .then(data => {
                                        if (!data.error) setStudio(data)
                                    })
                                    .catch(() => { })
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Location & Contact */}
            <StudioLocationContact studio={studio} />

            {/* FAQ Section */}
            {mergedMockData && <StudioFaqSection mockData={mergedMockData} />}

            {/* Final CTA */}
            <StudioFinalCta onBookingClick={openBookingModal} />

            {/* Modal prenotazione */}
            {showBookingForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="glass-widget rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-base-content mb-4">Prenota una visita</h2>
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-base-content mb-1">Servizio <span className="text-red-500">*</span></label>
                                {appointmentTypes.length > 0 ? (
                                    <select
                                        value={bookingData.appointmentTypeId}
                                        onChange={(e) => {
                                            const selectedId = e.target.value
                                            const selectedType = appointmentTypes.find(t => t.id === selectedId)
                                            setBookingData(p => ({
                                                ...p,
                                                appointmentTypeId: selectedId,
                                                serviceType: selectedType?.name || '',
                                                startTime: '',
                                                endTime: '',
                                                selectedDate: '',
                                            }))
                                            loadSlotsForAppointmentType(selectedId)
                                        }}
                                        className="select select-bordered w-full"
                                        required
                                    >
                                        <option value="">Seleziona servizio...</option>
                                        {appointmentTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name} - {type.durationMinutes} min</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-secondary">Nessun servizio disponibile al momento.</p>
                                )}
                            </div>

                            {bookingData.appointmentTypeId && (
                                <div className="space-y-2 rounded-lg border border-base-300 bg-base-100 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-base-content">Slot disponibili (14 giorni)</p>
                                        {slotsLoading && <span className="text-xs text-secondary">Caricamento...</span>}
                                    </div>
                                    {firstAvailableLabel && (
                                        <p className="text-xs text-primary">Prima disponibilità: {firstAvailableLabel}</p>
                                    )}
                                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                                        {Object.entries(availableByDay).map(([date, slots]) => (
                                            <div key={date}>
                                                <p className="text-xs font-semibold text-secondary mb-1">{date}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {slots.length === 0 ? (
                                                        <span className="text-xs text-secondary">Nessuno slot</span>
                                                    ) : slots.map((slot, index) => {
                                                        const isSelected = bookingData.selectedDate === date && bookingData.startTime.endsWith(`${slot.startTime}:00`)
                                                        return (
                                                            <button
                                                                key={`${date}-${slot.startTime}-${index}`}
                                                                type="button"
                                                                onClick={() => handleSelectSlot(date, slot)}
                                                                className={`px-2 py-1 rounded-md text-xs border transition ${isSelected
                                                                    ? 'bg-primary border-primary text-primary-content'
                                                                    : 'border-base-300 text-base-content hover:border-primary hover:text-primary'}`}
                                                            >
                                                                {slot.startTime}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(availableByDay).length === 0 && !slotsLoading && (
                                            <p className="text-xs text-secondary">Seleziona un servizio per vedere gli slot.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-base-content mb-1">Note</label>
                                <textarea
                                    value={bookingData.notes}
                                    onChange={e => setBookingData(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Descrivi brevemente il motivo della visita..."
                                    rows={3}
                                    className="textarea textarea-bordered w-full resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingForm(false)}
                                    className="btn btn-ghost flex-1"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading || !bookingData.startTime || !bookingData.endTime || !bookingData.appointmentTypeId}
                                    className="btn btn-primary flex-1"
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
