"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BriefcaseIcon, MapPinIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

const CATEGORIES = [
    { value: 'all', label: 'Tutti' },
    { value: 'player', label: 'Cercasi Giocatore' },
    { value: 'coach', label: 'Cercasi Coach/Allenatore' },
    { value: 'staff', label: 'Cercasi DS/Staff' },
    { value: 'other', label: 'Altro' }
]

export default function JobsPage() {
    const router = useRouter()
    const [jobs, setJobs] = useState<any[]>([])
    const [filteredJobs, setFilteredJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'player',
        description: '',
        location: '',
        contactEmail: ''
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setCurrentUserId(id)

        if (!id) {
            router.push('/login')
            return
        }

        fetchJobs()
    }, [router])

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            setJobs(data || [])
            filterJobs(data, selectedCategory)
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bacheca Annunci</h1>
                        <p className="text-gray-600">Trova opportunità o pubblica annunci per la tua squadra</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Crea Annuncio
                    </button>
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
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
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
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email contatto</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="tua-email@example.com"
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
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
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Jobs List */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Caricamento annunci...</div>
                ) : filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Nessun annuncio trovato</p>
                        <p className="text-sm text-gray-400">Sii il primo a pubblicare un annuncio!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.category === 'player' ? 'bg-blue-100 text-blue-700' :
                                                    job.category === 'coach' ? 'bg-green-100 text-green-700' :
                                                        job.category === 'staff' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {CATEGORIES.find(c => c.value === job.category)?.label || job.category}
                                            </span>
                                            {job.location && (
                                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{job.description}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Pubblicato da <strong>{job.authorName}</strong></span>
                                            <span>•</span>
                                            <span>{new Date(job.createdAt).toLocaleDateString('it-IT')}</span>
                                            {job.contactEmail && (
                                                <>
                                                    <span>•</span>
                                                    <a href={`mailto:${job.contactEmail}`} className="text-blue-600 hover:underline">
                                                        Contatta
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete button (solo per l'autore) */}
                                    {String(job.authorId) === String(currentUserId) && (
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Elimina annuncio"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
