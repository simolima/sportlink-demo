"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/upload-service'
import Avatar from '@/components/avatar'
import { CameraIcon } from '@heroicons/react/24/outline'

export default function EditProfilePage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [form, setForm] = useState<any>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        birthDate: '',
        currentRole: '',
        bio: '',
        avatarUrl: '',
        coverUrl: '',
        experiences: [] as any[],
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setUserId(id)
        if (!id) {
            router.push('/login')
            return
        }
        const load = async () => {
            try {
                const res = await fetch('/api/users')
                const users = await res.json()
                const u = (users || []).find((x: any) => String(x.id) === String(id))
                if (!u) {
                    router.push('/create-profile')
                    return
                }
                setForm({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    username: u.username || '',
                    email: u.email || '',
                    birthDate: u.birthDate || '',
                    currentRole: u.currentRole || '',
                    bio: u.bio || '',
                    avatarUrl: u.avatarUrl || u.profilePhoto || '',
                    coverUrl: u.coverUrl || '',
                    experiences: Array.isArray(u.experiences)
                        ? u.experiences.map((e: any) => ({
                            role: e.role || e.title || '',
                            team: e.team || e.company || '',
                            category: e.category || '',
                            from: e.from || '',
                            to: e.to || '',
                            summary: e.summary || e.description || '',
                        }))
                        : [],
                })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    const updateField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
    const addExp = () => updateField('experiences', [...form.experiences, { role: '', team: '', category: '', from: '', to: '', summary: '' }])
    const removeExp = (i: number) => updateField('experiences', form.experiences.filter((_: any, idx: number) => idx !== i))
    const editExp = (i: number, k: string, v: any) => updateField('experiences', form.experiences.map((e: any, idx: number) => idx === i ? { ...e, [k]: v } : e))

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file')
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB')
                return
            }
            setAvatarFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Seleziona un file immagine valido (JPEG, PNG, WebP)')
                return
            }

            // Check file size (max 10MB for cover photos)
            if (file.size > 10 * 1024 * 1024) {
                alert('La dimensione dell\'immagine deve essere inferiore a 10MB')
                return
            }

            // Check image dimensions
            const img = new Image()
            const reader = new FileReader()

            reader.onloadend = () => {
                img.src = reader.result as string
                setCoverPreview(reader.result as string)
            }

            img.onload = () => {
                const width = img.width
                const height = img.height
                const aspectRatio = width / height

                // Recommended minimum dimensions
                if (width < 1200 || height < 400) {
                    const proceed = confirm(
                        `⚠️ Attenzione: L'immagine ha dimensioni ${width}x${height}px.\n\n` +
                        `Per una migliore qualità, si consiglia un'immagine di almeno 1200x400px.\n\n` +
                        `Vuoi procedere comunque?`
                    )
                    if (!proceed) {
                        setCoverPreview(null)
                        setCoverFile(null)
                        e.target.value = ''
                        return
                    }
                }

                // Check aspect ratio (recommended 3:1)
                if (aspectRatio < 2.5 || aspectRatio > 3.5) {
                    alert(
                        `💡 Suggerimento: Per un risultato ottimale, usa un'immagine con rapporto 3:1 (es. 1200x400px).\n\n` +
                        `La tua immagine ha rapporto ${aspectRatio.toFixed(2)}:1`
                    )
                }

                setCoverFile(file)
            }

            reader.readAsDataURL(file)
        }
    }

    const save = async () => {
        if (!userId) return
        if (!form.firstName.trim() || !form.lastName.trim()) {
            alert('Nome e cognome sono obbligatori')
            return
        }
        setSaving(true)
        try {
            // Upload new avatar if selected
            let avatarUrl = form.avatarUrl
            if (avatarFile) {
                const result = await uploadService.uploadFile(avatarFile, 'avatars')
                if (result.success) {
                    avatarUrl = result.url
                } else {
                    alert('Errore durante upload immagine: ' + result.error)
                    setSaving(false)
                    return
                }
            }

            // Upload new cover photo if selected
            let coverUrl = form.coverUrl
            if (coverFile) {
                const result = await uploadService.uploadFile(coverFile, 'covers')
                if (result.success) {
                    coverUrl = result.url
                } else {
                    alert('Errore durante upload foto di copertina: ' + result.error)
                    setSaving(false)
                    return
                }
            }

            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, ...form, avatarUrl, coverUrl })
            })
            if (res.ok) {
                const updated = await res.json()
                // Aggiorna localStorage per coerenza con header/navbar
                localStorage.setItem('currentUserName', `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim())
                localStorage.setItem('currentUserUsername', updated.username ?? '')
                localStorage.setItem('currentUserEmail', updated.email ?? '')
                if (updated.avatarUrl) {
                    localStorage.setItem('currentUserAvatar', updated.avatarUrl)
                }
                router.push(`/profile/${updated.id}`)
            } else {
                const e = await res.json()
                alert(e.error || 'Errore salvataggio')
            }
        } finally {
            setSaving(false)
        }
    }

    if (!userId || loading) return <div className="max-w-3xl mx-auto p-6">Caricamento...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">Modifica profilo</h1>
                    <p className="text-lg text-gray-600 mt-3 font-light">Aggiorna le tue informazioni personali e il tuo percorso professionale</p>
                </div>

                <div className="space-y-8">
                    {/* Cover Photo Section */}
                    <div className="bg-base-200 rounded-2xl shadow-lg overflow-hidden border border-base-300">
                        <div className="relative">
                            <div className="h-56 md:h-72 bg-gradient-to-r from-primary to-blue-600 overflow-hidden">
                                {(coverPreview || form.coverUrl) ? (
                                    <img
                                        src={coverPreview || form.coverUrl}
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <div className="text-center">
                                            <CameraIcon className="w-20 h-20 mx-auto mb-3 opacity-50" />
                                            <p className="text-base opacity-75 font-light">Aggiungi una foto di copertina</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="cover-upload"
                                className="absolute bottom-4 right-4 bg-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl hover:bg-gray-50 transition cursor-pointer font-semibold text-sm text-gray-700"
                            >
                                <CameraIcon className="w-5 h-5" />
                                {coverPreview || form.coverUrl ? 'Cambia' : 'Aggiungi'}
                            </label>
                            <input
                                id="cover-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                            {coverFile && (
                                <div className="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-lg font-semibold">
                                    ✓ Pronto per il salvataggio
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Avatar and Basic Info Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Informazioni personali</h2>

                        {/* Avatar and Name Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                            {/* Avatar */}
                            <div className="flex flex-col items-center md:col-span-1">
                                <div className="relative mb-4">
                                    <Avatar
                                        src={avatarPreview || form.avatarUrl}
                                        alt="Profile preview"
                                        size="xl"
                                        fallbackText={form.firstName?.[0] || '?'}
                                        className="w-40 h-40 ring-4 ring-primary/20 shadow-lg"
                                    />
                                    <label
                                        htmlFor="avatar-upload-edit"
                                        className="absolute bottom-0 right-0 btn btn-primary btn-circle"
                                    >
                                        <CameraIcon className="w-6 h-6" />
                                    </label>
                                    <input
                                        id="avatar-upload-edit"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-center font-medium">{avatarFile ? `✓ ${avatarFile.name}` : 'Clicca per cambiare'}</p>
                            </div>

                            {/* Name and Contact */}
                            <div className="md:col-span-3 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome</label>
                                        <input
                                            className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                            placeholder="Nome"
                                            value={form.firstName}
                                            onChange={e => updateField('firstName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cognome</label>
                                        <input
                                            className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                            placeholder="Cognome"
                                            value={form.lastName}
                                            onChange={e => updateField('lastName', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                        <input
                                            className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                            placeholder="email@example.com"
                                            value={form.email}
                                            onChange={e => updateField('email', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                                        <input
                                            className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                            placeholder="@username"
                                            value={form.username}
                                            onChange={e => updateField('username', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Data di nascita</label>
                                    <input
                                        type="date"
                                        className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                        value={form.birthDate || ''}
                                        onChange={e => updateField('birthDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Presentazione</h2>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Bio / Descrizione personale</label>
                            <textarea
                                className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base font-light"
                                rows={5}
                                placeholder="Raccontati... quali sono i tuoi punti di forza, la tua esperienza e i tuoi obiettivi?"
                                value={form.bio}
                                onChange={e => updateField('bio', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2">Max 500 caratteri</p>
                        </div>
                    </div>

                    {/* Professional Info Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Informazioni professionali</h2>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Ruolo attuale</label>
                            <input
                                className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-base"
                                placeholder="es. Attaccante, Coach, Direttore Sportivo"
                                value={form.currentRole}
                                onChange={e => updateField('currentRole', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Experiences Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-secondary">Percorso professionale</h2>
                            <button
                                onClick={addExp}
                                className="btn btn-primary"
                            >
                                + Aggiungi esperienza
                            </button>
                        </div>

                        {form.experiences.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 text-base font-light">Nessuna esperienza aggiunta. Clicca il pulsante sopra per iniziare.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {form.experiences.map((exp: any, i: number) => (
                                    <div key={i} className="border-l-4 border-primary bg-gradient-to-r from-base-300 to-transparent rounded-xl p-6 shadow-sm hover:shadow-md transition">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs font-bold text-secondary/70 mb-2 block uppercase tracking-wide">Ruolo</label>
                                                <input
                                                    className="w-full border-2 border-base-300 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-base-100 text-secondary"
                                                    placeholder="es. Attaccante"
                                                    value={exp.role || ''}
                                                    onChange={e => editExp(i, 'role', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Squadra / Società</label>
                                                <input
                                                    className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                                    placeholder="es. AS Roma"
                                                    value={exp.team || ''}
                                                    onChange={e => editExp(i, 'team', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Categoria</label>
                                            <input
                                                className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                                placeholder="es. Serie A, Under 19"
                                                value={exp.category || ''}
                                                onChange={e => editExp(i, 'category', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Da</label>
                                                <input
                                                    className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                                    placeholder="2022"
                                                    value={exp.from || ''}
                                                    onChange={e => editExp(i, 'from', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">A</label>
                                                <input
                                                    className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                                    placeholder="Presente"
                                                    value={exp.to || ''}
                                                    onChange={e => editExp(i, 'to', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Descrizione</label>
                                            <textarea
                                                className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                                rows={3}
                                                placeholder="Responsabilità, risultati e dettagli importanti..."
                                                value={exp.summary || ''}
                                                onChange={e => editExp(i, 'summary', e.target.value)}
                                            />
                                        </div>
                                        <div className="text-right pt-2 border-t border-gray-200">
                                            <button
                                                onClick={() => removeExp(i)}
                                                className="text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition"
                                            >
                                                ✕ Rimuovi
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pb-8">
                        <button
                            onClick={() => router.back()}
                            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition text-base"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="btn btn-primary px-8 py-3 text-base"
                        >
                            {saving ? 'Salvataggio in corso...' : 'Salva modifiche'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
