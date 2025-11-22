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
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
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

            // Upload cover photo if selected
            let coverUrl = null
            if (coverFile) {
                const result = await uploadService.uploadFile(coverFile, 'covers')
                if (result.success) {
                    coverUrl = result.url
                } else {
                    alert('Errore durante upload foto di copertina: ' + result.error)
                    setUploading(false)
                    return
                }
            }

            // Create user profile with avatar URL and cover URL
            const payload = {
                firstName,
                lastName,
                birthDate,
                currentRole,
                bio,
                experiences,
                email,
                avatarUrl,
                coverUrl
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <h1 className="text-2xl font-semibold p-6 border-b">Crea il tuo profilo</h1>

                    {/* Cover Photo Section */}
                    <div className="relative">
                        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-blue-700 overflow-hidden">
                            {coverPreview ? (
                                <img 
                                    src={coverPreview} 
                                    alt="Cover preview" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white">
                                    <div className="text-center">
                                        <CameraIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm opacity-75">Aggiungi una foto di copertina (opzionale)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="cover-upload-create"
                            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer"
                        >
                            <CameraIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {coverPreview ? 'Cambia copertina' : 'Aggiungi copertina'}
                            </span>
                        </label>
                        <input
                            id="cover-upload-create"
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                        />
                        {coverFile && (
                            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">
                                ✓ Foto selezionata
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Info box for cover photo */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">💡 Consigli per la foto di copertina:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• <strong>Dimensioni consigliate:</strong> 1200x400 pixel (rapporto 3:1)</li>
                                <li>• <strong>Dimensione massima:</strong> 10MB</li>
                                <li>• Usa immagini orizzontali per un risultato migliore</li>
                            </ul>
                        </div>

                        {/* Avatar upload section */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <Avatar
                                    src={avatarPreview}
                                    alt="Profile preview"
                                    size="xl"
                                    fallbackText={firstName?.[0] || '?'}
                                    className="w-28 h-28"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition"
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
                                <div className="flex items-center justify-between"><h2 className="font-semibold">Esperienze passate</h2><button onClick={addExp} className="text-sm text-green-600">Aggiungi</button></div>
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
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition"
                                >
                                    {uploading ? 'Caricamento...' : 'Crea profilo'}
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    disabled={uploading}
                                    className="px-6 py-3 border-2 rounded-lg disabled:opacity-50 font-semibold"
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
