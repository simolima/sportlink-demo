'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    CalendarDaysIcon, UserGroupIcon, BuildingOffice2Icon,
    PencilSquareIcon, XMarkIcon, PlusCircleIcon
} from '@heroicons/react/24/outline'
import AddressAutocomplete from '@/components/address-autocomplete'
import { useAuth } from '@/lib/hooks/useAuth'
import { type ProfessionalStudio, type StudioAppointment } from '@/lib/types'
import { supabase as supabaseBrowser } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { useToast } from '@/lib/toast-context'

type Tab = 'overview' | 'appointments' | 'clients' | 'edit'

export default function StudioDashboardPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const { showToast } = useToast()

    const studioId = params.id as string
    const initialTab = (searchParams.get('tab') as Tab) || 'overview'

    const [activeTab, setActiveTab] = useState<Tab>(initialTab)
    const [studio, setStudio] = useState<ProfessionalStudio | null>(null)
    const [appointments, setAppointments] = useState<StudioAppointment[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newService, setNewService] = useState('')

    // Form edit state (copia dal studio caricato)
    const [editForm, setEditForm] = useState({
        name: '', city: '', address: '', phone: '', website: '', description: '', servicesOffered: [] as string[]
    })

    useEffect(() => {
        const loadStudio = async () => {
            const res = await fetch(`/api/studios/${studioId}`)
            const data = await res.json()
            if (data.error || !data) { router.replace('/studios'); return }
            setStudio(data)
            setEditForm({
                name: data.name || '',
                city: data.city || '',
                address: data.address || '',
                phone: data.phone || '',
                website: data.website || '',
                description: data.description || '',
                servicesOffered: data.servicesOffered || [],
            })
        }
        const loadAppointments = async () => {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/appointments`, { credentials: 'include', headers: authHeaders })
            if (res.ok) setAppointments(await res.json())
        }
        const loadClients = async () => {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/clients`, { credentials: 'include', headers: authHeaders })
            if (res.ok) setClients(await res.json())
        }

        Promise.all([loadStudio(), loadAppointments(), loadClients()]).finally(() => setLoading(false))
    }, [studioId, router])

    // Guard: solo owner
    useEffect(() => {
        if (!loading && studio && user && String(user.id) !== String(studio.ownerId)) {
            router.replace(`/studios/${studioId}`)
        }
    }, [loading, studio, user, router, studioId])

    const handleChangeStatus = async (apptId: string, status: string) => {
        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/appointments/${apptId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ status }),
        })
        if (res.ok) {
            const updated = await res.json()
            setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: updated.status } : a))
            showToast('success', 'Aggiornato', `Appuntamento ${status}`)
        } else {
            showToast('error', 'Errore', 'Impossibile aggiornare')
        }
    }

    const handleClientStatus = async (clientProfileId: string, status: string) => {
        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/clients`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ clientId: clientProfileId, status }),
        })
        if (res.ok) {
            setClients(prev => prev.map(c => c.clientProfileId === clientProfileId ? { ...c, status } : c))
            showToast('success', 'Aggiornato', `Cliente ${status}`)
        }
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(editForm),
            })
            const data = await res.json()
            if (!res.ok) { showToast('error', 'Errore', data.error); return }
            setStudio(data)
            showToast('success', 'Salvato', 'Studio aggiornato')
            setActiveTab('overview')
        } finally { setSaving(false) }
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'badge badge-warning',
            confirmed: 'badge badge-success',
            cancelled: 'badge badge-error',
            completed: 'badge badge-info',
            active: 'badge badge-success',
            inactive: 'badge badge-ghost',
        }
        return map[status] || 'badge'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
            </div>
        )
    }
    if (!studio) return null

    const pendingAppts = appointments.filter(a => a.status === 'pending').length

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{studio.name}</h1>
                        <p className="text-gray-500 text-sm">Dashboard gestionale</p>
                    </div>
                    <Link href={`/studios/${studioId}`} className="text-sm text-brand-600 hover:text-brand-700">
                        ← Pagina pubblica
                    </Link>
                </div>

                {/* Stats rapide */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                        <p className="text-sm text-gray-500">Appuntamenti totali</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                        <p className="text-2xl font-bold text-orange-600">{pendingAppts}</p>
                        <p className="text-sm text-gray-500">In attesa di conferma</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                        <p className="text-sm text-gray-500">Clienti registrati</p>
                    </div>
                </div>

                {/* Tab navigation */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {([
                            { key: 'overview', label: 'Panoramica', icon: BuildingOffice2Icon },
                            { key: 'appointments', label: `Appuntamenti${pendingAppts > 0 ? ` (${pendingAppts})` : ''}`, icon: CalendarDaysIcon },
                            { key: 'clients', label: 'Clienti', icon: UserGroupIcon },
                            { key: 'edit', label: 'Modifica', icon: PencilSquareIcon },
                        ] as const).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition border-b-2 ${activeTab === key
                                    ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Ultimi appuntamenti</h3>
                                {appointments.slice(0, 5).length === 0 ? (
                                    <p className="text-gray-400 text-sm">Nessun appuntamento ancora.</p>
                                ) : (
                                    appointments.slice(0, 5).map(a => (
                                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {a.client?.firstName} {a.client?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(a.startTime).toLocaleString('it-IT')}
                                                    {a.serviceType && ` · ${a.serviceType}`}
                                                </p>
                                            </div>
                                            <span className={statusBadge(a.status)}>{a.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* APPOINTMENTS */}
                        {activeTab === 'appointments' && (
                            <div className="space-y-3">
                                {appointments.length === 0 ? (
                                    <p className="text-gray-400 text-sm">Nessun appuntamento.</p>
                                ) : appointments.map(a => (
                                    <div key={a.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{a.client?.firstName} {a.client?.lastName}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(a.startTime).toLocaleString('it-IT')} → {new Date(a.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {a.serviceType && <p className="text-xs text-gray-400 mt-0.5">{a.serviceType}</p>}
                                            {a.notes && <p className="text-xs text-gray-500 mt-1 italic">{a.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={statusBadge(a.status)}>{a.status}</span>
                                            {a.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleChangeStatus(a.id, 'confirmed')} className="btn btn-xs btn-success">Conferma</button>
                                                    <button onClick={() => handleChangeStatus(a.id, 'cancelled')} className="btn btn-xs btn-error btn-outline">Cancella</button>
                                                </>
                                            )}
                                            {a.status === 'confirmed' && (
                                                <button onClick={() => handleChangeStatus(a.id, 'completed')} className="btn btn-xs btn-info">Completato</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CLIENTS */}
                        {activeTab === 'clients' && (
                            <div className="space-y-3">
                                {clients.length === 0 ? (
                                    <p className="text-gray-400 text-sm">Nessun cliente ancora.</p>
                                ) : clients.map(c => (
                                    <div key={c.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {c.client?.firstName?.[0]}{c.client?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <Link href={`/profile/${c.clientProfileId}`} className="font-medium text-gray-900 hover:text-brand-600">
                                                    {c.client?.firstName} {c.client?.lastName}
                                                </Link>
                                                {c.onboardedAt && <p className="text-xs text-gray-400">Dal {new Date(c.onboardedAt).toLocaleDateString('it-IT')}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={statusBadge(c.status)}>{c.status}</span>
                                            {c.status === 'pending' && (
                                                <button onClick={() => handleClientStatus(c.clientProfileId, 'active')} className="btn btn-xs btn-success">Attiva</button>
                                            )}
                                            {c.status === 'active' && (
                                                <button onClick={() => handleClientStatus(c.clientProfileId, 'inactive')} className="btn btn-xs btn-ghost btn-outline">Disattiva</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* EDIT */}
                        {activeTab === 'edit' && (
                            <form onSubmit={handleSaveEdit} className="space-y-5 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                                    <AddressAutocomplete
                                        value={editForm.address}
                                        onChange={({ address, city }) => {
                                            setEditForm(p => ({
                                                ...p,
                                                address,
                                                city: city || p.city,
                                            }))
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                                        <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                                        <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sito web</label>
                                    <input type="url" value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                                    <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Servizi</label>
                                    <div className="flex gap-2 mb-2">
                                        <input value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newService.trim()) { setEditForm(p => ({ ...p, servicesOffered: [...p.servicesOffered, newService.trim()] })); setNewService('') } } }} placeholder="Aggiungi servizio..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                                        <button type="button" onClick={() => { if (newService.trim()) { setEditForm(p => ({ ...p, servicesOffered: [...p.servicesOffered, newService.trim()] })); setNewService('') } }} className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"><PlusCircleIcon className="h-5 w-5" /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {editForm.servicesOffered.map((s, i) => (
                                            <span key={i} className="flex items-center gap-1 text-sm bg-brand-50 text-brand-800 px-3 py-1 rounded-full border border-brand-100">
                                                {s}
                                                <button type="button" onClick={() => setEditForm(p => ({ ...p, servicesOffered: p.servicesOffered.filter((_, j) => j !== i) }))}><XMarkIcon className="h-3.5 w-3.5" /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setActiveTab('overview')} className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Annulla</button>
                                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-semibold disabled:opacity-60">{saving ? 'Salvataggio...' : 'Salva modifiche'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
