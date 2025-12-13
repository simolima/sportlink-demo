'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'
import { SUPPORTED_SPORTS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

export default function CreateClubPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sports: [] as string[],
    city: '',
    address: '',
    website: '',
    foundedYear: '',
  })

  const toggleSport = (sport: string) => {
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || formData.sports.length === 0 || !formData.city) {
      showToast('error', 'Campi obbligatori', 'Nome, sport e città sono obbligatori')
      return
    }

    setLoading(true)

    try {
      const userId = localStorage.getItem('currentUserId')
      if (!userId) {
        router.push('/login')
        return
      }

      // Fetch user data
      const usersRes = await fetch('/api/users')
      const users = await usersRes.json()
      const user = users.find((u: any) => u.id.toString() === userId)

      if (!user) {
        showToast('error', 'Errore', 'Utente non trovato')
        router.push('/login')
        return
      }

      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
          createdBy: user.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        showToast('error', 'Errore', error.error || 'Impossibile creare la società')
        return
      }

      const club = await res.json()

      // Crea automaticamente membership come Admin
      await fetch('/api/club-memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: club.id,
          userId: user.id,
          role: 'Admin',
          permissions: ['create_announcements', 'manage_applications', 'manage_members', 'edit_club_info'],
        }),
      })

      showToast('success', 'Società creata!', 'La tua società è stata creata con successo')

      setTimeout(() => router.push(`/clubs/${club.id}`), 1000)
    } catch (error) {
      showToast('error', 'Errore', 'Si è verificato un errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crea una Società</h1>
              <p className="text-gray-600">Compila i campi per creare la tua società sportiva</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Società <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. AC Milano Calcio"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrivi la tua società..."
              />
            </div>

            {/* Sport (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SUPPORTED_SPORTS.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.sports.includes(sport)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Città e Indirizzo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Città <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. Milano"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. Via dello Sport, 1"
                />
              </div>
            </div>

            {/* Anno fondazione e Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anno di Fondazione
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. 1899"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sito Web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://esempio.com"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creazione in corso...' : 'Crea Società'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
