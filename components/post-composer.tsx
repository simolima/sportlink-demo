'use client'
import { useState } from 'react'

export default function PostComposer() {
    const [text, setText] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [author, setAuthor] = useState('')

    // prefill from localStorage if available
    if (typeof window !== 'undefined' && !author) {
        const saved = localStorage.getItem('currentUserName')
        if (saved) setAuthor(saved)
    }

    const submit = async () => {
        if (!text.trim() && !imageUrl.trim()) return
        setLoading(true)
        try {
            const authorId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
            await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text, imageUrl: imageUrl || null, authorName: author || 'Anon', authorId: authorId ? Number(authorId) : null })
            })
            setText(''); setImageUrl('')
            // simple reload to refresh server-rendered feed
            window.location.reload()
        } catch (e) {
            console.error(e)
            alert('Errore durante la pubblicazione')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1">
                    <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Tuo nome (es. Marco Bianchi)" className="w-full p-2 border rounded mb-2" />
                    <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Scrivi qualcosa..." className="w-full p-2 border rounded h-24" />
                    <div className="flex gap-2 items-center mt-2">
                        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (opzionale)" className="flex-1 p-2 border rounded" />
                        <button onClick={submit} disabled={loading} className="bg-gradient-to-br from-pink-500 to-yellow-400 text-white px-3 py-1 rounded">{loading ? 'Posting...' : 'Posta'}</button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Suggerimento: per la demo puoi incollare un URL immagine pubblico (es. immagini hostate su imgur).</div>
                </div>
            </div>
        </div>
    )
}
