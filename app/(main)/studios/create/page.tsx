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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <BuildingOffice2Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Crea il tuo Studio</h1>
                        <p className="text-gray-500 text-sm">Mostra i tuoi servizi professionali</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome dello studio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="Es: Studio Fisioterapico Rossi"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Indirizzo con Google Places */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={e => handleChange('city', e.target.value)}
                            placeholder="Es: Milano"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
                        />
                    </div>

                    {/* Telefono e Sito */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                                placeholder="+39 02 12345678"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sito web</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={e => handleChange('website', e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Descrizione */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                        <textarea
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Descrivi i tuoi servizi, la tua esperienza e l'approccio professionale..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Servizi offerti */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servizi offerti</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newService}
                                onChange={e => setNewService(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                                placeholder="Es: Fisioterapia, Riabilitazione..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={addService}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                            >
                                <PlusCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                        {formData.servicesOffered.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.servicesOffered.map((s, i) => (
                                    <span key={i} className="flex items-center gap-1 text-sm bg-brand-50 text-brand-800 px-3 py-1 rounded-full border border-brand-200">
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
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-semibold disabled:opacity-60"
                        >
                            {loading ? 'Creazione...' : 'Crea Studio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
