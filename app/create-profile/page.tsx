'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/upload-service'
import Avatar from '@/components/avatar'
import { CameraIcon } from '@heroicons/react/24/outline'

export default function CreateProfile() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [currentRole, setCurrentRole] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')
    const [experiences, setExperiences] = useState([{ title: '', company: '', from: '', to: '' }])
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const addExp = () => setExperiences(s => [...s, { title: '', company: '', from: '', to: '' }])
    const updateExp = (i: number, field: string, value: string) => {
        setExperiences(s => s.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file')
                return
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB')
                return
            }
            setAvatarFile(file)
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const submit = async () => {
        setUploading(true)
        try {
            // Upload avatar first if selected
            let avatarUrl = null
            if (avatarFile) {
                const result = await uploadService.uploadFile(avatarFile, 'avatars')
                if (result.success) {
                    avatarUrl = result.url
                } else {
                    alert('Errore durante upload immagine: ' + result.error)
                    setUploading(false)
                    return
                }
            }

            // Create user profile with avatar URL
            const payload = {
                firstName,
                lastName,
                birthDate,
                currentRole,
                bio,
                experiences,
                email,
                avatarUrl
            }
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                if (res.status === 409) {
                    alert('Questa email è già registrata')
                    setUploading(false)
                    return
                }
                alert('Errore creazione profilo')
                setUploading(false)
                return
            }
            const user = await res.json()
            // save small auth in localStorage for demo
            localStorage.setItem('currentUserId', String(user.id))
            localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
            localStorage.setItem('currentUserEmail', String(user.email ?? ''))
            if (user.avatarUrl) {
                localStorage.setItem('currentUserAvatar', user.avatarUrl)
            }
            router.push('/')
        } catch (error) {
            console.error('Error creating profile:', error)
            alert('Errore durante la creazione del profilo')
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-8 flex items-center justify-center">
                <div className="w-full">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h1 className="text-2xl font-semibold mb-4">Crea il tuo profilo</h1>

                        {/* Avatar upload section */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <Avatar
                                    src={avatarPreview}
                                    alt="Profile preview"
                                    size="xl"
                                    fallbackText={firstName?.[0] || '?'}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition"
                                >
                                    <CameraIcon className="w-4 h-4" />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                {avatarFile ? avatarFile.name : 'Clicca per aggiungere una foto profilo'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" className="w-full p-3 border rounded" />
                            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Cognome" className="w-full p-3 border rounded" />
                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} placeholder="Data di nascita" className="w-full p-3 border rounded" />
                            <input value={currentRole} onChange={e => setCurrentRole(e.target.value)} placeholder="Ruolo attuale (es. Giocatore - Centrocampista)" className="w-full p-3 border rounded" />
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded" />
                            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Breve bio" className="w-full p-3 border rounded h-28" />

                            <div>
                                <div className="flex items-center justify-between"><h2 className="font-semibold">Esperienze passate</h2><button onClick={addExp} className="text-sm text-blue-600">Aggiungi</button></div>
                                <div className="space-y-2 mt-2">
                                    {experiences.map((exp, i) => (
                                        <div key={i} className="p-3 border rounded">
                                            <input value={exp.title} onChange={e => updateExp(i, 'title', e.target.value)} placeholder="Ruolo" className="w-full p-2 border rounded mb-1" />
                                            <input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Società" className="w-full p-2 border rounded mb-1" />
                                            <div className="flex gap-2">
                                                <input value={exp.from} onChange={e => updateExp(i, 'from', e.target.value)} placeholder="Da (YYYY)" className="w-1/2 p-2 border rounded" />
                                                <input value={exp.to} onChange={e => updateExp(i, 'to', e.target.value)} placeholder="A (YYYY o vuoto)" className="w-1/2 p-2 border rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={submit}
                                    disabled={uploading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition"
                                >
                                    {uploading ? 'Caricamento...' : 'Crea profilo'}
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    disabled={uploading}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
