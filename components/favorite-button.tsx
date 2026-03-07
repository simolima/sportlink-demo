'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

interface FavoriteButtonProps {
    targetId: string | number
    currentUserId: string | null
}

export default function FavoriteButton({ targetId, currentUserId }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!currentUserId || !targetId) return
        fetch(`/api/favorites?userId=${currentUserId}&favoriteId=${targetId}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : []
                setIsFavorite(list.some((f: any) => String(f.favoriteId || f.favorite_id) === String(targetId)))
            })
            .catch(() => { })
    }, [currentUserId, targetId])

    if (!currentUserId || String(currentUserId) === String(targetId)) return null

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (loading) return
        setLoading(true)
        try {
            if (isFavorite) {
                await fetch(`/api/favorites?userId=${currentUserId}&favoriteId=${targetId}`, { method: 'DELETE' })
                setIsFavorite(false)
            } else {
                await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId, favoriteId: targetId }),
                })
                setIsFavorite(true)
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            className={`p-1.5 rounded-full border transition-all duration-150 ${isFavorite
                    ? 'bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
    )
}
