'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/address-autocomplete'
import { getAuthHeaders } from '@/lib/auth-fetch'

type StudioSettings = {
    name: string
    city: string
    address: string
    phone: string
    website: string
    description: string
    bookingEnabled: boolean
    autoConfirmBookings: boolean
    slotIncrementMinutes: 15 | 30 | 60
    defaultBufferBetweenAppointments: number
    yearsOfExperience: number | ''
    languages: string[]
    workModes: Array<'in-person' | 'remote' | 'hybrid'>
    certifications: string[]
    methodology: string
}

const DEFAULT_SETTINGS: StudioSettings = {
    name: '',
    city: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    bookingEnabled: false,
    autoConfirmBookings: false,
    slotIncrementMinutes: 30,
    defaultBufferBetweenAppointments: 5,
    yearsOfExperience: '',
    languages: [],
    workModes: [],
    certifications: [],
    methodology: '',
}

export default function StudioDashboardSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const studioId = params.id as string

    const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [newLanguage, setNewLanguage] = useState('')
    const [newCertification, setNewCertification] = useState('')

    const normalizeStringArray = (input: unknown): string[] => {
        if (!Array.isArray(input)) return []
        return input
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean)
    }

    const addLanguage = () => {
        const value = newLanguage.trim()
        if (!value) return
        setSettings((prev) => {
            if (prev.languages.some((lang) => lang.toLowerCase() === value.toLowerCase())) return prev
            return { ...prev, languages: [...prev.languages, value] }
        })
        setNewLanguage('')
    }

    const addCertification = () => {
        const value = newCertification.trim()
        if (!value) return
        setSettings((prev) => {
            if (prev.certifications.some((cert) => cert.toLowerCase() === value.toLowerCase())) return prev
            return { ...prev, certifications: [...prev.certifications, value] }
        })
        setNewCertification('')
    }

    useEffect(() => {
        async function loadSettings() {
            const res = await fetch(`/api/studios/${studioId}`)
            if (!res.ok) {
                router.replace('/studios')
                return
            }

            const data = await res.json()
            setSettings({
                name: data.name || '',
                city: data.city || '',
                address: data.address || '',
                phone: data.phone || '',
                website: data.website || '',
                description: data.description || '',
                bookingEnabled: Boolean(data.bookingEnabled),
                autoConfirmBookings: Boolean(data.autoConfirmBookings),
                slotIncrementMinutes: (data.slotIncrementMinutes || 30) as 15 | 30 | 60,
                defaultBufferBetweenAppointments: Number(data.defaultBufferBetweenAppointments || 5),
                yearsOfExperience: data.yearsOfExperience ?? '',
                languages: normalizeStringArray(data.languages),
                workModes: data.workModes ?? [],
                certifications: normalizeStringArray(data.certifications),
                methodology: data.methodology ?? '',
            })

            setLoading(false)
        }

        loadSettings()
    }, [router, studioId])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    ...settings,
                    languages: normalizeStringArray(settings.languages),
                    certifications: normalizeStringArray(settings.certifications),
                    yearsOfExperience: settings.yearsOfExperience === '' ? null : Number(settings.yearsOfExperience),
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile salvare le impostazioni dello studio')
                return
            }

            setMessage('Impostazioni salvate con successo.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="glass-widget rounded-2xl p-6">Caricamento impostazioni...</div>
    }

    return (
        <section className="space-y-5 glass-widget rounded-2xl p-6">
            <div>
                <h1 className="text-2xl font-bold text-base-content">Impostazioni</h1>
                <p className="mt-1 text-sm text-secondary">Profilo studio e configurazione prenotazioni.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Nome studio</span>
                        <input
                            className="input input-bordered"
                            placeholder="Nome studio"
                            value={settings.name}
                            onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Citta</span>
                        <input
                            className="input input-bordered"
                            placeholder="Citta"
                            value={settings.city}
                            onChange={(e) => setSettings((prev) => ({ ...prev, city: e.target.value }))}
                        />
                    </label>
                </div>

                <div>
                    <label className="mb-1 block text-sm text-secondary">Indirizzo</label>
                    <AddressAutocomplete
                        value={settings.address}
                        onChange={({ address, city }) => {
                            setSettings((prev) => ({
                                ...prev,
                                address,
                                city: city || prev.city,
                            }))
                        }}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Telefono</span>
                        <input
                            className="input input-bordered"
                            placeholder="Telefono"
                            value={settings.phone}
                            onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Sito web</span>
                        <input
                            className="input input-bordered"
                            placeholder="Sito web"
                            value={settings.website}
                            onChange={(e) => setSettings((prev) => ({ ...prev, website: e.target.value }))}
                        />
                    </label>
                </div>

                <label className="form-control">
                    <span className="label-text mb-1 block text-sm text-secondary">Descrizione</span>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        rows={4}
                        placeholder="Descrizione"
                        value={settings.description}
                        onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                    />
                </label>

                <div className="grid gap-3 rounded-lg border border-base-300 bg-base-100 p-3 md:grid-cols-2">
                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.bookingEnabled}
                            onChange={(e) => setSettings((prev) => ({ ...prev, bookingEnabled: e.target.checked }))}
                        />
                        <span className="label-text inline-flex items-center gap-2">
                            Abilita prenotazioni online
                            <span
                                className="tooltip tooltip-top"
                                data-tip="Quando attivo, i clienti possono vedere gli slot disponibili e inviare nuove richieste di prenotazione online."
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-base-300 text-xs font-semibold text-secondary">
                                    ?
                                </span>
                            </span>
                        </span>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={settings.autoConfirmBookings}
                            onChange={(e) => setSettings((prev) => ({ ...prev, autoConfirmBookings: e.target.checked }))}
                        />
                        <span className="label-text inline-flex items-center gap-2">
                            Conferma automatica prenotazioni
                            <span
                                className="tooltip tooltip-top"
                                data-tip="Quando attivo, le nuove prenotazioni vengono confermate subito senza approvazione manuale. Se disattivo, restano in attesa."
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-base-300 text-xs font-semibold text-secondary">
                                    ?
                                </span>
                            </span>
                        </span>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Intervallo slot</span>
                        <select
                            className="select select-bordered"
                            value={settings.slotIncrementMinutes}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    slotIncrementMinutes: Number(e.target.value) as 15 | 30 | 60,
                                }))
                            }
                        >
                            <option value={15}>15 minuti</option>
                            <option value={30}>30 minuti</option>
                            <option value={60}>60 minuti</option>
                        </select>
                    </label>

                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-secondary">Buffer predefinito (min)</span>
                        <input
                            type="number"
                            className="input input-bordered"
                            min={0}
                            max={60}
                            value={settings.defaultBufferBetweenAppointments}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    defaultBufferBetweenAppointments: Number(e.target.value),
                                }))
                            }
                        />
                    </label>
                </div>

                {/* Professional Profile Section */}
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                    <h3 className="text-lg font-semibold text-gray-900">Profilo Professionale</h3>

                    {/* Years of Experience */}
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Anni di esperienza</span>
                        <input
                            type="number"
                            className="input input-bordered bg-white"
                            min={0}
                            placeholder="Es. 10"
                            value={settings.yearsOfExperience}
                            onChange={(e) => setSettings((prev) => ({ ...prev, yearsOfExperience: e.target.value ? Number(e.target.value) : '' }))}
                        />
                    </label>

                    {/* Languages */}
                    <div className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Lingue parlate</span>
                        <div className="mb-2 flex flex-wrap gap-2">
                            {settings.languages.map((lang, idx) => (
                                <div key={idx} className="badge badge-lg badge-primary gap-2 pr-1 text-primary-content">
                                    {lang}
                                    <button
                                        type="button"
                                        aria-label={`Rimuovi lingua ${lang}`}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary-content/40 text-xs text-primary-content transition hover:bg-primary-content/20"
                                        onClick={() => {
                                            setSettings((prev) => ({
                                                ...prev,
                                                languages: prev.languages.filter((_, i) => i !== idx),
                                            }))
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        {settings.languages.length === 0 && <p className="mb-2 text-xs text-gray-500">Nessuna lingua inserita.</p>}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input input-bordered bg-white flex-1"
                                placeholder="Es. Italiano"
                                value={newLanguage}
                                onChange={(e) => setNewLanguage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addLanguage()
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={addLanguage}
                            >
                                Aggiungi
                            </button>
                        </div>
                    </div>

                    {/* Work Modes */}
                    <div className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Modalità di lavoro</span>
                        <div className="flex flex-col gap-2">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={settings.workModes.includes('in-person')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: [...prev.workModes, 'in-person'],
                                            }))
                                        } else {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: prev.workModes.filter((m) => m !== 'in-person'),
                                            }))
                                        }
                                    }}
                                />
                                <span className="label-text">In presenza</span>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={settings.workModes.includes('remote')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: [...prev.workModes, 'remote'],
                                            }))
                                        } else {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: prev.workModes.filter((m) => m !== 'remote'),
                                            }))
                                        }
                                    }}
                                />
                                <span className="label-text">Remoto</span>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={settings.workModes.includes('hybrid')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: [...prev.workModes, 'hybrid'],
                                            }))
                                        } else {
                                            setSettings((prev) => ({
                                                ...prev,
                                                workModes: prev.workModes.filter((m) => m !== 'hybrid'),
                                            }))
                                        }
                                    }}
                                />
                                <span className="label-text">Ibrido</span>
                            </label>
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Certificazioni</span>
                        <div className="mb-2 flex flex-wrap gap-2">
                            {settings.certifications.map((cert, idx) => (
                                <div key={idx} className="badge badge-lg badge-outline gap-2">
                                    {cert}
                                    <button
                                        type="button"
                                        aria-label={`Rimuovi certificazione ${cert}`}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-base-content/20 text-xs text-base-content transition hover:bg-base-300"
                                        onClick={() => {
                                            setSettings((prev) => ({
                                                ...prev,
                                                certifications: prev.certifications.filter((_, i) => i !== idx),
                                            }))
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        {settings.certifications.length === 0 && <p className="mb-2 text-xs text-gray-500">Nessuna certificazione inserita.</p>}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input input-bordered bg-white flex-1"
                                placeholder="Es. Certificazione nazionale"
                                value={newCertification}
                                onChange={(e) => setNewCertification(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addCertification()
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={addCertification}
                            >
                                Aggiungi
                            </button>
                        </div>
                    </div>

                    {/* Methodology */}
                    <label className="form-control">
                        <span className="label-text mb-1 block text-sm text-gray-600">Metodologia</span>
                        <textarea
                            className="textarea textarea-bordered bg-white w-full"
                            rows={5}
                            placeholder="Descrivi il tuo approccio metodologico..."
                            value={settings.methodology}
                            onChange={(e) => setSettings((prev) => ({ ...prev, methodology: e.target.value }))}
                        />
                    </label>
                </div>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                    Salva impostazioni
                </button>
            </form>

            {message && <p className="text-sm text-secondary">{message}</p>}
        </section>
    )
}
