'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BuildingOffice2Icon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/toast-context'
import { MEDICAL_ROLES } from '@/lib/types'
import { supabase as supabaseBrowser } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/auth-fetch'
import AddressAutocomplete from '@/components/address-autocomplete'

export default function CreateStudioPage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useRequireAuth(false)
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [newService, setNewService] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        city: '',
        address: '',
        phone: '',
        website: '',
        description: '',
        servicesOffered: [] as string[],
    })

    // Guard: solo ruoli medici
    useEffect(() => {
        if (authLoading) return
        if (!user) return
        if (!MEDICAL_ROLES.includes(user.professionalRole as any)) {
            showToast('error', 'Accesso negato', 'Solo Preparatori Atletici, Nutrizionisti e Fisioterapisti possono creare uno studio')
            router.replace('/studios')
        }
    }, [user, authLoading, router, showToast])

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addService = () => {
        const s = newService.trim()
        if (!s || formData.servicesOffered.includes(s)) return
        setFormData(prev => ({ ...prev, servicesOffered: [...prev.servicesOffered, s] }))
        setNewService('')
    }

    const removeService = (s: string) => {
        setFormData(prev => ({ ...prev, servicesOffered: prev.servicesOffered.filter(x => x !== s) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            showToast('error', 'Campo obbligatorio', 'Inserisci il nome dello studio')
            return
        }

        setLoading(true)
        try {
            const { data: { session } } = await supabaseBrowser.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            const res = await fetch('/api/studios', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify(formData),
            })
            const data = await res.json()

            if (!res.ok) {
                showToast('error', 'Errore', data.error || 'Impossibile creare lo studio')
                return
            }

            showToast('success', 'Studio creato!', `"${data.name}" è ora online`)
            router.push(`/studios/${data.id}`)
        } catch {
            showToast('error', 'Errore', 'Si è verificato un errore imprevisto')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="glass-page-bg min-h-screen flex items-center justify-center">
                <div className="loading loading-spinner loading-lg text-primary" />
            </div>
        )
    }

    return (
        <div className="glass-page-bg min-h-screen py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-base-200 rounded-lg border border-base-300">
                        <BuildingOffice2Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-base-content">Crea il tuo Studio</h1>
                        <p className="text-secondary text-sm">Mostra i tuoi servizi professionali</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="glass-widget rounded-2xl p-6 space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                            Nome dello studio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="Es: Studio Fisioterapico Rossi"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    {/* Indirizzo con Google Places */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Indirizzo</label>
                        <AddressAutocomplete
                            value={formData.address}
                            onChange={({ address, city }) => {
                                setFormData(prev => ({
                                    ...prev,
                                    address,
                                    city: city || prev.city,
                                }))
                            }}
                        />
                    </div>

                    {/* Città (auto-popolata dall'indirizzo) */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Città</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={e => handleChange('city', e.target.value)}
                            placeholder="Es: Milano"
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Telefono e Sito */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Telefono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                                placeholder="+39 02 12345678"
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Sito web</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={e => handleChange('website', e.target.value)}
                                placeholder="https://..."
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

                    {/* Descrizione */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Descrizione</label>
                        <textarea
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Descrivi i tuoi servizi, la tua esperienza e l'approccio professionale..."
                            rows={4}
                            className="textarea textarea-bordered w-full resize-none"
                        />
                    </div>

                    {/* Servizi offerti */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Servizi offerti</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newService}
                                onChange={e => setNewService(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                                placeholder="Es: Fisioterapia, Riabilitazione..."
                                className="input input-bordered flex-1"
                            />
                            <button
                                type="button"
                                onClick={addService}
                                className="btn btn-primary px-4"
                            >
                                <PlusCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                        {formData.servicesOffered.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.servicesOffered.map((s, i) => (
                                    <span key={i} className="flex items-center gap-1 text-sm bg-base-200 text-base-content px-3 py-1 rounded-full border border-base-300">
                                        {s}
                                        <button type="button" onClick={() => removeService(s)}>
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-ghost flex-1"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary flex-1"
                        >
                            {loading ? 'Creazione...' : 'Crea Studio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
