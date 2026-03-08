'use client'

import { FormEvent, useEffect, useState, Suspense, lazy } from 'react'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-fetch'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const EmojiPicker = lazy(() => import('@emoji-mart/react'))

type Specialization = {
    id: string
    name: string
    description: string | null
    icon: string
    displayOrder: number
}

function SortableItem({ specialization, onEdit, onDelete }: { specialization: Specialization; onEdit: () => void; onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: specialization.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-xl">
                ⠿
            </div>
            <div className="text-2xl">{specialization.icon}</div>
            <div className="flex-1">
                <div className="font-semibold text-gray-900">{specialization.name}</div>
                {specialization.description && <div className="text-sm text-gray-600">{specialization.description}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
                ✏️
            </button>
            <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onDelete}>
                🗑️
            </button>
        </div>
    )
}

export default function StudioDashboardSpecializationsPage() {
    const params = useParams()
    const studioId = params.id as string

    const [specializations, setSpecializations] = useState<Specialization[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [form, setForm] = useState({
        name: '',
        description: '',
        icon: '🎯',
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        async function loadSpecializations() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/specializations`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                setSpecializations(await res.json())
            }
            setLoading(false)
        }

        loadSpecializations()
    }, [studioId])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = specializations.findIndex((s) => s.id === active.id)
            const newIndex = specializations.findIndex((s) => s.id === over.id)

            const newOrder = arrayMove(specializations, oldIndex, newIndex)
            setSpecializations(newOrder)

            // Persist reorder to backend
            const authHeaders = await getAuthHeaders()
            const updates = newOrder.map((spec, idx) => ({
                id: spec.id,
                displayOrder: idx,
            }))

            for (const update of updates) {
                await fetch(`/api/studios/${studioId}/specializations/${update.id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    body: JSON.stringify({ displayOrder: update.displayOrder }),
                })
            }
        }
    }

    const handleOpenCreate = () => {
        setEditingId(null)
        setForm({ name: '', description: '', icon: '🎯' })
        setShowModal(true)
    }

    const handleOpenEdit = (spec: Specialization) => {
        setEditingId(spec.id)
        setForm({ name: spec.name, description: spec.description || '', icon: spec.icon })
        setShowModal(true)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const payload = {
                name: form.name,
                description: form.description || null,
                icon: form.icon,
            }

            const res = editingId
                ? await fetch(`/api/studios/${studioId}/specializations/${editingId}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    body: JSON.stringify(payload),
                })
                : await fetch(`/api/studios/${studioId}/specializations`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    body: JSON.stringify(payload),
                })

            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Impossibile salvare la specializzazione')
                return
            }

            // Reload list
            const listRes = await fetch(`/api/studios/${studioId}/specializations`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (listRes.ok) {
                setSpecializations(await listRes.json())
            }

            setShowModal(false)
            setMessage(editingId ? 'Specializzazione aggiornata con successo' : 'Specializzazione creata con successo')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa specializzazione?')) return

        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/specializations/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
        })

        if (res.ok) {
            setSpecializations((prev) => prev.filter((s) => s.id !== id))
            setMessage('Specializzazione eliminata con successo')
        } else {
            const data = await res.json()
            setMessage(data.error || 'Impossibile eliminare la specializzazione')
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento specializzazioni...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Specializzazioni</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestisci le aree di competenza mostrate nella pagina pubblica.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
                    ➕ Nuova Specializzazione
                </button>
            </div>

            {specializations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    Nessuna specializzazione. Creane una per iniziare.
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={specializations.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {specializations.map((spec) => (
                                <SortableItem
                                    key={spec.id}
                                    specialization={spec}
                                    onEdit={() => handleOpenEdit(spec)}
                                    onDelete={() => handleDelete(spec.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {message && <p className="text-sm text-gray-600">{message}</p>}

            {/* Modal */}
            {showModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Modifica Specializzazione' : 'Nuova Specializzazione'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Icon Picker */}
                            <div className="form-control">
                                <span className="label-text mb-1 block text-sm">Icona</span>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">{form.icon}</div>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                    >
                                        {showEmojiPicker ? 'Chiudi' : 'Cambia'}
                                    </button>
                                </div>
                                {showEmojiPicker && (
                                    <Suspense fallback={<div className="text-sm text-gray-600 mt-2">Caricamento emoji...</div>}>
                                        <div className="mt-2">
                                            <EmojiPicker
                                                onEmojiSelect={(emoji: any) => {
                                                    setForm((prev) => ({ ...prev, icon: emoji.native }))
                                                    setShowEmojiPicker(false)
                                                }}
                                            />
                                        </div>
                                    </Suspense>
                                )}
                            </div>

                            {/* Name */}
                            <label className="form-control">
                                <span className="label-text mb-1 block text-sm">Nome</span>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="Es. Fisioterapia Sportiva"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </label>

                            {/* Description */}
                            <label className="form-control">
                                <span className="label-text mb-1 block text-sm">Descrizione (opzionale)</span>
                                <textarea
                                    className="textarea textarea-bordered"
                                    rows={3}
                                    placeholder="Breve descrizione..."
                                    value={form.description}
                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </label>

                            <div className="modal-action">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                                    Annulla
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Salvataggio...' : 'Salva'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
