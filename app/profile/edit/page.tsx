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
                    experiences: Array.isArray(u.experiences) ? u.experiences : [],
                })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    const updateField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
    const addExp = () => updateField('experiences', [...form.experiences, { title: '', company: '', from: '', to: '', description: '' }])
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
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Modifica profilo</h1>
            <div className="space-y-6 bg-white rounded-lg shadow">
                {/* Cover Photo Section */}
                <div className="relative">
                    <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg overflow-hidden">
                        {(coverPreview || form.coverUrl) ? (
                            <img 
                                src={coverPreview || form.coverUrl} 
                                alt="Cover preview" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                                <div className="text-center">
                                    <CameraIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm opacity-75">Nessuna foto di copertina</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <label
                        htmlFor="cover-upload"
                        className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <CameraIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                            {coverPreview || form.coverUrl ? 'Cambia copertina' : 'Aggiungi copertina'}
                        </span>
                    </label>
                    <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                    />
                    {coverFile && (
                        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">
                            ✓ Nuova foto selezionata
                        </div>
                    )}
                </div>

                {/* Info box for cover photo */}
                <div className="px-6 -mt-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">💡 Consigli per la foto di copertina:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Dimensioni consigliate:</strong> 1200x400 pixel (rapporto 3:1)</li>
                            <li>• <strong>Dimensione massima file:</strong> 10MB</li>
                            <li>• <strong>Formati supportati:</strong> JPEG, PNG, WebP</li>
                            <li>• Usa immagini orizzontali per un risultato migliore</li>
                        </ul>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    {/* Avatar upload section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <Avatar
                                src={avatarPreview || form.avatarUrl}
                                alt="Profile preview"
                                size="xl"
                                fallbackText={form.firstName?.[0] || '?'}
                                className="w-28 h-28"
                            />
                            <label
                                htmlFor="avatar-upload-edit"
                                className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition"
                            >
                                <CameraIcon className="w-4 h-4" />
                            </label>
                            <input
                                id="avatar-upload-edit"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {avatarFile ? `Nuova foto: ${avatarFile.name}` : 'Clicca per cambiare foto profilo'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nome</label>
                        <input className="w-full border p-2 rounded" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Cognome</label>
                        <input className="w-full border p-2 rounded" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Username</label>
                        <input className="w-full border p-2 rounded" value={form.username} onChange={e => updateField('username', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input className="w-full border p-2 rounded" value={form.email} onChange={e => updateField('email', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Data di nascita</label>
                        <input type="date" className="w-full border p-2 rounded" value={form.birthDate || ''} onChange={e => updateField('birthDate', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Ruolo attuale</label>
                        <input className="w-full border p-2 rounded" value={form.currentRole} onChange={e => updateField('currentRole', e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Bio</label>
                    <textarea className="w-full border p-2 rounded" rows={4} value={form.bio} onChange={e => updateField('bio', e.target.value)} />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-600">Esperienze</label>
                        <button onClick={addExp} className="text-sm text-green-600">+ Aggiungi</button>
                    </div>
                    <div className="space-y-3">
                        {form.experiences.map((exp: any, i: number) => (
                            <div key={i} className="grid grid-cols-2 gap-3 border p-3 rounded">
                                <input className="border p-2 rounded" placeholder="Titolo" value={exp.title || ''} onChange={e => editExp(i, 'title', e.target.value)} />
                                <input className="border p-2 rounded" placeholder="Società" value={exp.company || ''} onChange={e => editExp(i, 'company', e.target.value)} />
                                <input className="border p-2 rounded" placeholder="Da (es. 2022)" value={exp.from || ''} onChange={e => editExp(i, 'from', e.target.value)} />
                                <input className="border p-2 rounded" placeholder="A (es. 2024 o Presente)" value={exp.to || ''} onChange={e => editExp(i, 'to', e.target.value)} />
                                <textarea className="border p-2 rounded col-span-2" placeholder="Descrizione" value={exp.description || ''} onChange={e => editExp(i, 'description', e.target.value)} />
                                <div className="col-span-2 text-right">
                                    <button onClick={() => removeExp(i)} className="text-sm text-red-600">Rimuovi</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => router.back()} className="px-4 py-2 border rounded">Annulla</button>
                        <button onClick={save} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700">{saving ? 'Salvataggio...' : 'Salva modifiche'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
