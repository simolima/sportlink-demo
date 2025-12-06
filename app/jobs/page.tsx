"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BriefcaseIcon, MapPinIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useRequireAuth } from '@/lib/hooks/useAuth'

const CATEGORIES = [
    { value: 'all', label: 'Tutti' },
    { value: 'player', label: 'Cercasi Giocatore' },
    { value: 'coach', label: 'Cercasi Coach/Allenatore' },
    { value: 'staff', label: 'Cercasi DS/Staff' },
    { value: 'other', label: 'Altro' }
]

export default function JobsPage() {
    const { user, isLoading: authLoading } = useRequireAuth(true)
    const router = useRouter()
    const [jobs, setJobs] = useState<any[]>([])
    const [filteredJobs, setFilteredJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
    const [showApplicationsView, setShowApplicationsView] = useState(false)

    const currentUserId = user?.id ? String(user.id) : null

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'player',
        description: '',
        location: '',
        contactEmail: ''
    })

    useEffect(() => {
        if (user) {
            fetchJobs()
        }
    }, [user])

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            setJobs(data || [])
            filterJobs(data, selectedCategory)
            if (!selectedJobId && (data || []).length > 0) {
                setSelectedJobId(data[0].id)
            }
        } catch (e) {
            console.error('Error fetching jobs:', e)
        } finally {
            setLoading(false)
        }
    }

    const filterJobs = (jobList: any[], category: string) => {
        if (category === 'all') {
            setFilteredJobs(jobList)
        } else {
            setFilteredJobs(jobList.filter(j => j.category === category))
        }
    }

    useEffect(() => {
        filterJobs(jobs, selectedCategory)
    }, [selectedCategory, jobs])

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            alert('Titolo e descrizione sono obbligatori')
            return
        }

        const authorName = typeof window !== 'undefined' ? localStorage.getItem('currentUserName') : 'Utente'

        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    authorId: currentUserId,
                    authorName
                })
            })

            if (res.ok) {
                setFormData({ title: '', category: 'player', description: '', location: '', contactEmail: '' })
                setShowCreateForm(false)
                fetchJobs()
            }
        } catch (e) {
            console.error('Error creating job:', e)
            alert('Errore nella creazione dell\'annuncio')
        }
    }

    const handleDelete = async (jobId: number) => {
        if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return

        try {
            const res = await fetch('/api/jobs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, authorId: currentUserId })
            })

            if (res.ok) {
                fetchJobs()
            } else {
                const data = await res.json()
                alert(data.error || 'Errore nell\'eliminazione')
            }
        } catch (e) {
            console.error('Error deleting job:', e)
        }
    }

    if (!currentUserId) return null

    const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId))

    const alreadyApplied = selectedJob && Array.isArray(selectedJob.applications)
        ? selectedJob.applications.some((a: any) => String(a.applicantId) === String(currentUserId))
        : false

    const handleApply = async () => {
        if (!selectedJob) return
        if (alreadyApplied) return
        try {
            const res = await fetch('/api/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply', jobId: selectedJob.id, applicantId: currentUserId })
            })
            if (res.ok) {
                const data = await res.json()
                // Update local jobs state with updated job
                const updated = (jobs || []).map(j => String(j.id) === String(selectedJob.id) ? data.job : j)
                setJobs(updated)
                filterJobs(updated, selectedCategory)
            } else {
                const e = await res.json()
                alert(e.error || 'Errore nella candidatura')
            }
        } catch (e) {
            console.error('apply error', e)
        }
    }

    // no job-level chat here; a separate user-to-user chat can be implemented later

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bacheca Annunci</h1>
                        <p className="text-gray-600">Trova opportunità o pubblica annunci per la tua squadra</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApplicationsView(v => !v)}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${showApplicationsView ? 'bg-blue-50 text-sprinta-blue border border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}
                        >
                            Candidature ricevute
                        </button>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="flex items-center gap-2 px-6 py-3 bg-sprinta-blue text-white rounded-lg font-semibold hover:bg-sprinta-blue-hover transition"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Crea Annuncio
                        </button>
                    </div>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Nuovo Annuncio</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titolo *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="es. Cercasi centrocampista per squadra serie C"
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sprinta-blue focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sprinta-blue focus:outline-none"
                                >
                                    <option value="player">Cercasi Giocatore</option>
                                    <option value="coach">Cercasi Coach/Allenatore</option>
                                    <option value="staff">Cercasi DS/Staff</option>
                                    <option value="other">Altro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrizione *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    placeholder="Descrivi la posizione, requisiti, esperienza richiesta, ecc."
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sprinta-blue focus:outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Località</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="es. Milano, Italia"
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sprinta-blue focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email contatto</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="tua-email@example.com"
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sprinta-blue focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-sprinta-blue text-white rounded-lg font-semibold hover:bg-sprinta-blue-hover"
                                >
                                    Pubblica Annuncio
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${selectedCategory === cat.value
                                ? 'bg-sprinta-blue text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Split layout: list (1/3) + detail/applications (2/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3 lg:col-span-1">
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Caricamento annunci...</div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">Nessun annuncio trovato</p>
                                <p className="text-sm text-gray-400">Sii il primo a pubblicare un annuncio!</p>
                            </div>
                        ) : (
                            filteredJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJobId(job.id)}
                                    className={`w-full text-left bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 border ${String(selectedJobId) === String(job.id) ? 'border-green-500' : 'border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${job.category === 'player' ? 'bg-green-100 text-green-700' :
                                            job.category === 'coach' ? 'bg-green-100 text-green-700' :
                                                job.category === 'staff' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {CATEGORIES.find(c => c.value === job.category)?.label || job.category}
                                        </span>
                                        {job.location && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPinIcon className="w-4 h-4" />
                                                {job.location}
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-semibold text-gray-900 line-clamp-1">{job.title}</div>
                                    <div className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString('it-IT')}</div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        {showApplicationsView ? (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold mb-4">Candidature ricevute (tutti i tuoi annunci)</h2>
                                {(() => {
                                    const mine = jobs.filter(j => String(j.authorId) === String(currentUserId))
                                    const allApps = mine.flatMap(j => (j.applications || []).map((a: any) => ({ job: j, app: a })))
                                    if (allApps.length === 0) return <div className="text-sm text-gray-500">Nessuna candidatura ancora.</div>
                                    return (
                                        <ul className="space-y-3">
                                            {allApps.map(({ job, app }: any) => (
                                                <li key={`${job.id}-${app.id}`} className="p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <a href={`/profile/${app.applicantId}`} className="font-semibold hover:underline">{app.applicantName}</a>
                                                            {app.applicantEmail && <span className="text-xs text-gray-500 ml-2">{app.applicantEmail}</span>}
                                                            <div className="text-xs text-gray-500">per: <span className="font-medium">{job.title}</span></div>
                                                        </div>
                                                        <div className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleString('it-IT')}</div>
                                                    </div>
                                                    {app.profileBio && <div className="text-sm text-gray-700 mt-1">{app.profileBio}</div>}
                                                    {Array.isArray(app.experiences) && app.experiences.length > 0 && (
                                                        <div className="text-xs text-gray-600 mt-2">
                                                            Esperienze: {app.experiences.map((e: any) => e.title).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                })()}
                            </div>
                        ) : !selectedJob ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">Seleziona un annuncio a sinistra</div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedJob.category === 'player' ? 'bg-green-100 text-green-700' :
                                                selectedJob.category === 'coach' ? 'bg-green-100 text-green-700' :
                                                    selectedJob.category === 'staff' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {CATEGORIES.find(c => c.value === selectedJob.category)?.label || selectedJob.category}
                                            </span>
                                            {selectedJob.location && (
                                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {selectedJob.location}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Pubblicato da{' '}
                                            <a href={`/profile/${selectedJob.authorId}`} className="font-semibold text-gray-900 hover:underline">{selectedJob.authorName}</a>
                                            {' '}• {new Date(selectedJob.createdAt).toLocaleDateString('it-IT')}
                                        </div>
                                    </div>
                                    {String(selectedJob.authorId) === String(currentUserId) && (
                                        <button
                                            onClick={() => handleDelete(selectedJob.id)}
                                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Elimina annuncio"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap mt-4">
                                    {selectedJob.description}
                                </div>

                                {/* Apply section */}
                                {String(selectedJob.authorId) !== String(currentUserId) && (
                                    <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                                        <div className="text-sm text-green-900">
                                            {alreadyApplied ? 'Hai già inviato la tua candidatura a questo annuncio.' : 'Invia la tua candidatura usando i dati del tuo profilo.'}
                                        </div>
                                        {!alreadyApplied && (
                                            <button onClick={handleApply} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Candidati</button>
                                        )}
                                    </div>
                                )}

                                {/* Applicants list (only for author) */}
                                {String(selectedJob.authorId) === String(currentUserId) && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-semibold mb-3">Candidature ricevute</h3>
                                        {(!selectedJob.applications || selectedJob.applications.length === 0) ? (
                                            <div className="text-sm text-gray-500">Nessuna candidatura ancora.</div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {selectedJob.applications.map((a: any) => (
                                                    <li key={a.id} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <a href={`/profile/${a.applicantId}`} className="font-semibold hover:underline">{a.applicantName}</a>
                                                                {a.applicantEmail && <span className="text-xs text-gray-500 ml-2">{a.applicantEmail}</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString('it-IT')}</div>
                                                        </div>
                                                        {a.profileBio && <div className="text-sm text-gray-700 mt-1">{a.profileBio}</div>}
                                                        {Array.isArray(a.experiences) && a.experiences.length > 0 && (
                                                            <div className="text-xs text-gray-600 mt-2">
                                                                Esperienze: {a.experiences.map((e: any) => e.title).filter(Boolean).join(', ')}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Nessuna chat per annuncio - solo candidature sopra */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
