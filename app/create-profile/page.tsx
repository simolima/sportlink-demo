'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, CameraIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function CreateProfile() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Basic info
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)

    // Additional info
    const [birthDate, setBirthDate] = useState('')
    const [currentRole, setCurrentRole] = useState('')
    const [bio, setBio] = useState('')

    // Experiences
    const [experiences, setExperiences] = useState([{ title: '', company: '', from: '', to: '', description: '' }])

    // UI state
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Format date to readable format
    const formatBirthDate = (date: string) => {
        if (!date) return ''
        const d = new Date(date + 'T00:00:00')
        return d.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    // Handle photo upload
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProfilePhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removePhoto = () => {
        setProfilePhoto(null)
        setProfilePhotoFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Experience management
    const addExp = () => {
        setExperiences(s => [...s, { title: '', company: '', from: '', to: '', description: '' }])
    }

    const updateExp = (i: number, field: string, value: string) => {
        setExperiences(s => s.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
    }

    const removeExp = (i: number) => {
        if (experiences.length > 1) {
            setExperiences(s => s.filter((_, idx) => idx !== i))
        }
    }

    // Validate
    const validate = () => {
        setError(null)
        if (!firstName.trim()) { setError('Nome è obbligatorio'); return false }
        if (!lastName.trim()) { setError('Cognome è obbligatorio'); return false }
        if (!username.trim()) { setError('Username è obbligatorio'); return false }
        if (!email.trim()) { setError('Email è obbligatoria'); return false }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Email non valida'); return false }
        if (!currentRole.trim()) { setError('Ruolo attuale è obbligatorio'); return false }
        return true
    }

    // Submit
    const submit = async () => {
        if (!validate()) return

        setLoading(true)
        try {
            const payload = {
                firstName,
                lastName,
                username,
                email,
                birthDate,
                profilePhoto,
                currentRole,
                bio,
                experiences: experiences.filter(e => e.title || e.company)
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                if (res.status === 409) {
                    setError('Questa email o username è già registrato')
                    setLoading(false)
                    return
                }
                setError('Errore nella creazione del profilo')
                setLoading(false)
                return
            }

            const user = await res.json()
            localStorage.setItem('currentUserId', String(user.id))
            localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
            localStorage.setItem('currentUserUsername', user.username || '')
            localStorage.setItem('currentUserEmail', String(user.email ?? ''))
            router.push('/home')
        } catch (e) {
            setError('Errore durante la creazione del profilo')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto py-12 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Crea il tuo profilo</h1>
                    <p className="text-gray-600 mt-2">Completa le tue informazioni per iniziare</p>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* Error message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Photo Upload Section */}
                        <div className="border-b pb-8">
                            <h2 className="text-lg font-semibold mb-4">Foto profilo</h2>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-16 h-16 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                        >
                                            <CameraIcon className="w-4 h-4" />
                                            Carica foto
                                        </button>
                                        {profilePhoto && (
                                            <button
                                                onClick={removePhoto}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                                            >
                                                Rimuovi
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF max 5MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="border-b pb-8">
                            <h2 className="text-lg font-semibold mb-4">Informazioni di base</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="Nome *"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="Cognome *"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <input
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                    placeholder="Username (es. marco.rossi) *"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Email *"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="border-b pb-8">
                            <h2 className="text-lg font-semibold mb-4">Informazioni aggiuntive</h2>

                            {/* Birth Date with readable format */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data di nascita</label>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={e => setBirthDate(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    {birthDate && (
                                        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
                                            {formatBirthDate(birthDate)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <input
                                value={currentRole}
                                onChange={e => setCurrentRole(e.target.value)}
                                placeholder="Ruolo attuale (es. Calciatore - Centrocampista) *"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                            />

                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Descrivi brevemente il tuo profilo (max 500 caratteri)"
                                maxLength={500}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
                        </div>

                        {/* Experiences */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Esperienze professionali</h2>
                                <button
                                    onClick={addExp}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    + Aggiungi
                                </button>
                            </div>

                            <div className="space-y-4">
                                {experiences.map((exp, i) => (
                                    <div key={i} className="p-4 border border-gray-300 rounded-lg space-y-3 relative">
                                        {experiences.length > 1 && (
                                            <button
                                                onClick={() => removeExp(i)}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                value={exp.title}
                                                onChange={e => updateExp(i, 'title', e.target.value)}
                                                placeholder="Ruolo (es. Centrocampista)"
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                            <input
                                                value={exp.company}
                                                onChange={e => updateExp(i, 'company', e.target.value)}
                                                placeholder="Società/Team (es. AC Milan)"
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                value={exp.from}
                                                onChange={e => updateExp(i, 'from', e.target.value)}
                                                placeholder="Da (YYYY)"
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                            <input
                                                value={exp.to}
                                                onChange={e => updateExp(i, 'to', e.target.value)}
                                                placeholder="A (YYYY o vuoto se presente)"
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                        <textarea
                                            value={exp.description}
                                            onChange={e => updateExp(i, 'description', e.target.value)}
                                            placeholder="Descrizione del ruolo (opzionale)"
                                            maxLength={200}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none h-16"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-8 border-t">
                            <button
                                onClick={submit}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
                            >
                                {loading ? 'Creando...' : 'Crea profilo'}
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                disabled={loading}
                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
