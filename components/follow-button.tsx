"use client"
import { useEffect, useState } from 'react'

export default function FollowButton({ targetId }: { targetId: number | string }) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSelf, setIsSelf] = useState(false)

    useEffect(() => {
        const check = async () => {
            if (typeof window === 'undefined') return
            const followerId = localStorage.getItem('currentUserId')
            if (!followerId) return
            if (String(followerId) === String(targetId)) {
                setIsSelf(true)
                return
            }
            try {
                const res = await fetch(`/api/follows?followerId=${followerId}`)
                const data = await res.json()
                const exists = (data || []).find((f: any) => String(f.followingId) === String(targetId))
                setIsFollowing(Boolean(exists))
            } catch (e) {
                console.error('Error fetching follows', e)
            }
        }
        check()
    }, [targetId])

    const follow = async () => {
        if (loading) return
        const followerId = localStorage.getItem('currentUserId')
        if (!followerId) return alert('Devi essere loggato per seguire')
        setLoading(true)
        try {
            const res = await fetch('/api/follows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId, followingId: targetId })
            })
            if (res.ok) setIsFollowing(true)
        } catch (e) {
            console.error(e)
        } finally { setLoading(false) }
    }

    const unfollow = async () => {
        if (loading) return
        const followerId = localStorage.getItem('currentUserId')
        if (!followerId) return alert('Devi essere loggato per smettere di seguire')
        setLoading(true)
        try {
            const res = await fetch('/api/follows', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId, followingId: targetId })
            })
            if (res.ok) setIsFollowing(false)
        } catch (e) {
            console.error(e)
        } finally { setLoading(false) }
    }

    if (!targetId || isSelf) return null

    return (
        <button
            onClick={isFollowing ? unfollow : follow}
            disabled={loading}
            className={`px-4 py-1 rounded-full font-semibold transition ${isFollowing ? 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
            {loading ? '...' : isFollowing ? 'Segui già' : 'Segui'}
        </button>
    )
}
