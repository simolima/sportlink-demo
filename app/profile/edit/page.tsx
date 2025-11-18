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
    const [form, setForm] = useState<any>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        birthDate: '',
        currentRole: '',
        bio: '',
        avatarUrl: '',
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

            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, ...form, avatarUrl })
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
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Modifica profilo</h1>
            <div className="space-y-4 bg-white p-6 rounded shadow">
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
    )
}
