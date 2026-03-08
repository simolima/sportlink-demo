'use client'

import { FormEvent, useEffect, useState } from 'react'
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

type FAQ = {
    id: string
    question: string
    answer: string
    displayOrder: number
}

function SortableItem({ faq, onEdit, onDelete }: { faq: FAQ; onEdit: () => void; onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: faq.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-xl mt-1">
                ⠿
            </div>
            <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{faq.question}</div>
                <div className="text-sm text-gray-600">{faq.answer}</div>
            </div>
            <div className="flex gap-1">
                <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
                    ✏️
                </button>
                <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onDelete}>
                    🗑️
                </button>
            </div>
        </div>
    )
}

export default function StudioDashboardFaqsPage() {
    const params = useParams()
    const studioId = params.id as string

    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [form, setForm] = useState({
        question: '',
        answer: '',
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        async function loadFaqs() {
            const authHeaders = await getAuthHeaders()
            const res = await fetch(`/api/studios/${studioId}/faqs`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (res.ok) {
                setFaqs(await res.json())
            }
            setLoading(false)
        }

        loadFaqs()
    }, [studioId])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = faqs.findIndex((f) => f.id === active.id)
            const newIndex = faqs.findIndex((f) => f.id === over.id)

            const newOrder = arrayMove(faqs, oldIndex, newIndex)
            setFaqs(newOrder)

            // Persist reorder to backend
            const authHeaders = await getAuthHeaders()
            const updates = newOrder.map((faq, idx) => ({
                id: faq.id,
                displayOrder: idx,
            }))

            for (const update of updates) {
                await fetch(`/api/studios/${studioId}/faqs/${update.id}`, {
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
        setForm({ question: '', answer: '' })
        setShowModal(true)
    }

    const handleOpenEdit = (faq: FAQ) => {
        setEditingId(faq.id)
        setForm({ question: faq.question, answer: faq.answer })
        setShowModal(true)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const authHeaders = await getAuthHeaders()
            const payload = {
                question: form.question,
                answer: form.answer,
            }

            const res = editingId
                ? await fetch(`/api/studios/${studioId}/faqs/${editingId}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    body: JSON.stringify(payload),
                })
                : await fetch(`/api/studios/${studioId}/faqs`, {
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
                setMessage(data.error || 'Impossibile salvare la FAQ')
                return
            }

            // Reload list
            const listRes = await fetch(`/api/studios/${studioId}/faqs`, {
                credentials: 'include',
                headers: authHeaders,
            })
            if (listRes.ok) {
                setFaqs(await listRes.json())
            }

            setShowModal(false)
            setMessage(editingId ? 'FAQ aggiornata con successo' : 'FAQ creata con successo')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa FAQ?')) return

        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/studios/${studioId}/faqs/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
        })

        if (res.ok) {
            setFaqs((prev) => prev.filter((f) => f.id !== id))
            setMessage('FAQ eliminata con successo')
        } else {
            const data = await res.json()
            setMessage(data.error || 'Impossibile eliminare la FAQ')
        }
    }

    if (loading) {
        return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Caricamento FAQ...</div>
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Domande Frequenti (FAQ)</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestisci le FAQ mostrate nella pagina pubblica dello studio.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
                    ➕ Nuova FAQ
                </button>
            </div>

            {faqs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    Nessuna FAQ. Creane una per iniziare.
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {faqs.map((faq) => (
                                <SortableItem
                                    key={faq.id}
                                    faq={faq}
                                    onEdit={() => handleOpenEdit(faq)}
                                    onDelete={() => handleDelete(faq.id)}
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
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Modifica FAQ' : 'Nuova FAQ'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Question */}
                            <label className="form-control">
                                <span className="label-text mb-1 block text-sm">Domanda</span>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="Es. Quali patologie trattate?"
                                    value={form.question}
                                    onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                                    required
                                />
                            </label>

                            {/* Answer */}
                            <label className="form-control">
                                <span className="label-text mb-1 block text-sm">Risposta</span>
                                <textarea
                                    className="textarea textarea-bordered"
                                    rows={5}
                                    placeholder="Risposta dettagliata..."
                                    value={form.answer}
                                    onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                                    required
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
