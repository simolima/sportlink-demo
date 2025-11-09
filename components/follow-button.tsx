'use client'
import { useState, useEffect } from 'react'

export default function FollowButton({ authorId }: { authorId: number }) {
    const [status, setStatus] = useState<'loading' | 'followed' | 'not'>('loading')
    const [currentId, setCurrentId] = useState<number | null>(null)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) { setStatus('not'); setCurrentId(null); return }
        const followerId = Number(id)
        setCurrentId(followerId)
        // check follows
        fetch('/api/follows').then(r => r.json()).then(list => {
            const f = list.find((it: any) => it.followerId === followerId && it.followeeId === authorId)
            setStatus(f ? 'followed' : 'not')
        }).catch(() => setStatus('not'))
    }, [authorId])

    const toggle = async () => {
        if (!currentId) return alert('Devi essere loggato. Crea o accedi a un profilo.')
        setStatus('loading')
        const res = await fetch('/api/follows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followerId: currentId, followeeId: authorId }) })
        const json = await res.json()
        if (json.action === 'follow') setStatus('followed')
        else if (json.action === 'unfollow') setStatus('not')
        else setStatus('not')
    }

    if (status === 'loading') return <button className="text-sm px-2 py-1 border rounded">...</button>
    if (status === 'followed') return <button onClick={toggle} className="text-sm px-2 py-1 rounded bg-gray-100">Segui già</button>
    return <button onClick={toggle} className="text-sm px-2 py-1 rounded bg-gradient-to-br from-pink-500 to-yellow-400 text-white">Segui</button>
}
