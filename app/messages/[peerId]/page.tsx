"use client"
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MessageBubble from '@/components/message-bubble'
import { Message } from '@/lib/types'
import Link from 'next/link'

export default function ChatWithPeerPage() {
    const params = useParams()
    const router = useRouter()
    const peerId = params?.peerId as string
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        setCurrentUserId(localStorage.getItem('currentUserId'))
    }, [])

    useEffect(() => {
        const fetchThread = async () => {
            if (!currentUserId || !peerId) return
            setLoading(true)
            try {
                const res = await fetch(`/api/messages?userId=${currentUserId}&peerId=${peerId}`)
                const data = await res.json()
                setMessages(Array.isArray(data) ? data : [])
                setError(null)
                // marca come letti i messaggi appena caricati
                await fetch('/api/messages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId, peerId })
                })
            } catch (e) {
                setError('Errore nel caricamento messaggi')
            } finally {
                setLoading(false)
            }
        }
        fetchThread()
    }, [currentUserId, peerId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!text.trim() || !currentUserId) return
        setSending(true)
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: currentUserId, receiverId: peerId, text })
            })
            const newMsg = await res.json()
            if (newMsg && newMsg.id) {
                setMessages(prev => [...prev, newMsg])
                setText('')
            }
        } catch (e) {
            // silenzioso
        } finally {
            setSending(false)
        }
    }

    if (!currentUserId) return <div className="max-w-3xl mx-auto p-6">Devi essere loggato per vedere la chat.</div>

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-900">Indietro</button>
                    <h1 className="text-xl font-semibold">Chat con {peerId}</h1>
                </div>
                <Link href={`/profile/${peerId}`} className="text-sm text-blue-600 hover:underline">Vedi profilo</Link>
            </div>
            <div className="bg-white rounded-lg shadow p-4 h-[60vh] overflow-y-auto mb-4">
                {loading && <div>Caricamento...</div>}
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {!loading && messages.length === 0 && (
                    <div className="text-sm text-gray-500">Nessun messaggio. Scrivi il primo!</div>
                )}
                {messages.map(m => (
                    <MessageBubble key={m.id} message={m} currentUserId={currentUserId} />
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="flex items-end gap-3">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                        }
                    }}
                    placeholder="Scrivi un messaggio... (Invio per inviare, Shift+Invio per nuova riga)"
                    className="flex-1 border rounded px-3 py-2 text-sm resize-none h-24"
                />
                <button
                    onClick={sendMessage}
                    disabled={sending || !text.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                >Invia</button>
            </div>
        </div>
    )
}
