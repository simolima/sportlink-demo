'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateProfile() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [currentRole, setCurrentRole] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')
    const [experiences, setExperiences] = useState([{ title: '', company: '', from: '', to: '' }])
    const router = useRouter()

    const addExp = () => setExperiences(s => [...s, { title: '', company: '', from: '', to: '' }])
    const updateExp = (i: number, field: string, value: string) => {
        setExperiences(s => s.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
    }

    const submit = async () => {
        const payload = { firstName, lastName, currentRole, bio, experiences, email }
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) {
            if (res.status === 409) return alert('Questa email è già registrata')
            return alert('Errore creazione profilo')
        }
        const user = await res.json()
        // save small auth in localStorage for demo
        localStorage.setItem('currentUserId', String(user.id))
        localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`)
        localStorage.setItem('currentUserEmail', String(user.email ?? ''))
        router.push('/')
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crea il tuo profilo</h1>
            <div className="grid grid-cols-1 gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" className="p-2 border rounded" />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Cognome" className="p-2 border rounded" />
                <input value={currentRole} onChange={e => setCurrentRole(e.target.value)} placeholder="Ruolo attuale (es. Giocatore - Centrocampista)" className="p-2 border rounded" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="p-2 border rounded" />
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Breve bio" className="p-2 border rounded" />

                <div>
                    <div className="flex items-center justify-between"><h2 className="font-semibold">Esperienze passate</h2><button onClick={addExp} className="text-sm text-blue-600">Aggiungi</button></div>
                    <div className="space-y-2 mt-2">
                        {experiences.map((exp, i) => (
                            <div key={i} className="p-3 border rounded">
                                <input value={exp.title} onChange={e => updateExp(i, 'title', e.target.value)} placeholder="Ruolo" className="w-full p-1 border rounded mb-1" />
                                <input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Società" className="w-full p-1 border rounded mb-1" />
                                <div className="flex gap-2">
                                    <input value={exp.from} onChange={e => updateExp(i, 'from', e.target.value)} placeholder="Da (YYYY)" className="w-1/2 p-1 border rounded" />
                                    <input value={exp.to} onChange={e => updateExp(i, 'to', e.target.value)} placeholder="A (YYYY o vuoto)" className="w-1/2 p-1 border rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button onClick={submit} className="bg-gradient-to-br from-pink-500 to-yellow-400 text-white px-4 py-2 rounded">Crea profilo</button>
                    <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Annulla</button>
                </div>
            </div>
        </div>
    )
}
