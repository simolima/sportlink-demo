"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const save = async () => {
    if (!userId) return
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert('Nome e cognome sono obbligatori')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...form })
      })
      if (res.ok) {
        const updated = await res.json()
        // Aggiorna localStorage per coerenza con header/navbar
        localStorage.setItem('currentUserName', `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim())
        localStorage.setItem('currentUserUsername', updated.username ?? '')
        localStorage.setItem('currentUserEmail', updated.email ?? '')
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
          <label className="block text-sm text-gray-600 mb-1">Avatar URL</label>
          <input className="w-full border p-2 rounded" value={form.avatarUrl} onChange={e => updateField('avatarUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">Esperienze</label>
            <button onClick={addExp} className="text-sm text-blue-600">+ Aggiungi</button>
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
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded font-semibold">{saving ? 'Salvataggio...' : 'Salva modifiche'}</button>
        </div>
      </div>
    </div>
  )
}
