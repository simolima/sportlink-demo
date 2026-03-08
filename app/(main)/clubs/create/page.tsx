'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, AlertCircle, Link2, PlusCircle, X } from 'lucide-react'
import { SUPPORTED_SPORTS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'
import AddressAutocomplete from '@/components/address-autocomplete'
import { useRequireAuth } from '@/lib/hooks/useAuth'

interface MatchingOrg {
  id: string
  name: string
  city: string | null
  country: string
  sport_id: string | null
}

export default function CreateClubPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useRequireAuth(false)
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  // Blocca l'accesso ai non direttori sportivi
  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.professionalRole !== 'sporting_director') {
      showToast('error', 'Accesso negato', 'Solo i Direttori Sportivi possono creare società')
      router.replace('/clubs')
    }
  }, [user, authLoading, router, showToast])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sports: [] as string[],
    city: '',
    address: '',
    addressLat: null as number | null,
    addressLng: null as number | null,
    website: '',
    foundedYear: '',
  })

  // Org-matching state
  const [matchingOrgs, setMatchingOrgs] = useState<MatchingOrg[]>([])
  const [bannerVisible, setBannerVisible] = useState(false)
  // null = non scelto ancora, 'new' = crea nuovo, string = ID dell'org collegata
  const [selectedOrgId, setSelectedOrgId] = useState<string | 'new' | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ricerca debounced quando cambia il nome
  const searchOrgs = useCallback(async (name: string) => {
    if (name.trim().length < 3) {
      setMatchingOrgs([])
      setBannerVisible(false)
      setSelectedOrgId(null)
      return
    }
    try {
      const res = await fetch(`/api/sports-organizations?q=${encodeURIComponent(name.trim())}`)
      if (!res.ok) return
      const data = await res.json()
      const orgs: MatchingOrg[] = Array.isArray(data) ? data : (data.organizations ?? [])
      if (orgs.length > 0 && selectedOrgId === null) {
        setMatchingOrgs(orgs)
        setBannerVisible(true)
      } else if (orgs.length === 0) {
        setMatchingOrgs([])
        setBannerVisible(false)
      }
    } catch {
      // silenzioso
    }
  }, [selectedOrgId])

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name }))
    // Reset scelta org se il nome cambia
    setSelectedOrgId(null)
    setBannerVisible(false)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchOrgs(name), 600)
  }

  const handleLinkOrg = (orgId: string) => {
    setSelectedOrgId(orgId)
    setBannerVisible(false)
    const org = matchingOrgs.find((o) => o.id === orgId)
    showToast('success', 'Organizzazione collegata', `La società verrà collegata a "${org?.name}"`)
  }

  const handleCreateNew = () => {
    setSelectedOrgId('new')
    setBannerVisible(false)
    showToast('info', 'Nuova organizzazione', 'Verrà creata una nuova organizzazione per questa società')
  }

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

    // Se ci sono org corrispondenti e l'utente non ha scelto, chiedi di scegliere
    if (matchingOrgs.length > 0 && selectedOrgId === null) {
      setBannerVisible(true)
      showToast('warning', 'Scelta richiesta', 'Scegli se collegare la società a un\'organizzazione esistente o crearne una nuova')
      return
    }

    setLoading(true)

    try {
      if (!user?.id) {
        router.push('/login')
        return
      }

      // Se l'utente vuole creare una nuova organizzazione, la creiamo prima
      let organizationId: string | null = null

      if (selectedOrgId === 'new') {
        // Crea nuova organizzazione
        const orgRes = await fetch('/api/sports-organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            country: 'IT',
            city: formData.city || null,
          }),
        })
        if (orgRes.ok) {
          const orgData = await orgRes.json()
          organizationId = orgData.id
        }
      } else if (selectedOrgId && selectedOrgId !== 'new') {
        organizationId = selectedOrgId
      }
      // selectedOrgId === null (nessuna corrispondenza trovata) → organizationId resta null

      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
          createdBy: user.id,
          organizationId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        showToast('error', 'Errore', error.error || 'Impossibile creare la società')
        return
      }

      const club = await res.json()

      showToast('success', 'Società creata!', 'La tua società è stata creata con successo')
      setTimeout(() => router.push(`/clubs/${club.id}`), 1000)
    } catch (error) {
      showToast('error', 'Errore', 'Si è verificato un errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  // Indica se l'utente ha già fatto una scelta sull'org
  const orgChoiceMade = selectedOrgId !== null
  const linkedOrgName = orgChoiceMade && selectedOrgId !== 'new'
    ? matchingOrgs.find((o) => o.id === selectedOrgId)?.name
    : null

  return (
    <div className="min-h-screen glass-page-bg py-12 px-4 text-base-content">
      <div className="max-w-3xl mx-auto">
        <div className="glass-widget rounded-lg border border-base-300/70 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={32} className="text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-base-content">Crea una Società</h1>
              <p className="glass-subtle-text">Compila i campi per creare la tua società sportiva</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Nome Società <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-base-300 bg-base-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="es. AC Milano Calcio"
              />
            </div>

            {/* ── Banner org matching ── */}
            {bannerVisible && matchingOrgs.length > 0 && (
              <div className="relative bg-amber-50 border border-amber-200 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setBannerVisible(false)}
                  className="absolute top-3 right-3 text-amber-500 hover:text-amber-700"
                  aria-label="Chiudi"
                >
                  <X size={16} />
                </button>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Organizzazioni simili trovate
                    </p>
                    <p className="text-xs text-amber-700 mb-3">
                      Esistono già organizzazioni con un nome simile. Vuoi collegare la tua società a una di queste?
                    </p>
                    <div className="space-y-2 mb-3">
                      {matchingOrgs.slice(0, 4).map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between bg-base-100 border border-amber-200/70 rounded-md px-3 py-2"
                        >
                          <div>
                            <span className="text-sm font-medium text-base-content">{org.name}</span>
                            {org.city && (
                              <span className="text-xs glass-subtle-text ml-2">— {org.city}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLinkOrg(org.id)}
                            className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded px-2 py-1 transition-colors"
                          >
                            <Link2 size={12} />
                            Collega
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="flex items-center gap-1 text-xs font-medium glass-subtle-text hover:text-base-content underline underline-offset-2 transition-colors"
                    >
                      <PlusCircle size={12} />
                      No, crea una nuova organizzazione
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stato scelta org (feedback visivo) */}
            {orgChoiceMade && (
              <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 ${selectedOrgId === 'new'
                ? 'bg-info/10 text-info border border-info/20'
                : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                {selectedOrgId === 'new' ? (
                  <>
                    <PlusCircle size={14} />
                    <span>Verrà creata una <strong>nuova organizzazione</strong> per questa società</span>
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    <span>Collegata a: <strong>{linkedOrgName}</strong></span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedOrgId(null); setBannerVisible(matchingOrgs.length > 0) }}
                  className="ml-auto opacity-60 hover:opacity-100"
                  aria-label="Modifica scelta"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Descrizione
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-base-300 bg-base-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descrivi la tua società..."
              />
            </div>

            {/* Sport (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Sport <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SUPPORTED_SPORTS.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.sports.includes(sport)
                      ? 'bg-primary text-white'
                      : 'bg-base-200 text-secondary hover:bg-base-300'
                      }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Indirizzo con Google Maps Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Indirizzo sede
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={({ address, city, lat, lng }) => {
                  setFormData((prev) => ({
                    ...prev,
                    address,
                    city: city || prev.city,
                    addressLat: lat || null,
                    addressLng: lng || null,
                  }))
                }}
              />
            </div>

            {/* Città */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Città <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-base-300 bg-base-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="es. Milano"
                />
              </div>
            </div>

            {/* Anno fondazione e Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Anno di Fondazione
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  className="w-full px-4 py-2 border border-base-300 bg-base-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="es. 1899"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Sito Web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-base-300 bg-base-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://esempio.com"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-base-300 text-secondary rounded-lg hover:bg-base-200 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
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
