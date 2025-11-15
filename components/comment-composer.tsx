'use client'
import React, { useState } from 'react'

interface CommentComposerProps {
    postId: string | number
    onAdded?: () => void
}

export default function CommentComposer({ postId, onAdded }: CommentComposerProps) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!content.trim()) {
            alert('Scrivi un commento prima di inviare')
            return
        }

        const authorId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
        const authorName = typeof window !== 'undefined' ? localStorage.getItem('currentUserName') : 'Anonimo'

        if (!authorId) {
            alert('Devi essere loggato per commentare')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    authorId,
                    authorName,
                    content: content.trim()
                })
            })

            if (res.ok) {
                setContent('')
                onAdded?.()
            } else {
                const json = await res.json()
                alert(json?.error || 'Errore nella creazione del commento')
            }
        } catch (e) {
            console.error(e)
            alert('Errore di rete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={2}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Scrivi un commento..."
                disabled={loading}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
                <button
                    onClick={() => setContent('')}
                    className="px-4 py-1 text-sm text-gray-600 hover:text-gray-800"
                    disabled={loading}
                >
                    Annulla
                </button>
                <button
                    onClick={submit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading || !content.trim()}
                >
                    {loading ? 'Invio...' : 'Commenta'}
                </button>
            </div>
        </div>
    )
}
