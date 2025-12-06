"use client"
import { useEffect, useState } from 'react'

interface FollowStatsProps {
    userId: number
}

export default function FollowStats({ userId }: FollowStatsProps) {
    const [followers, setFollowers] = useState<number | null>(null)
    const [following, setFollowing] = useState<number | null>(null)
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                setError(null)
                const [followersRes, followingRes] = await Promise.all([
                    fetch(`/api/follows?followingId=${userId}`), // people who follow this user
                    fetch(`/api/follows?followerId=${userId}`)   // people this user follows
                ])
                if (!followersRes.ok || !followingRes.ok) throw new Error('network')
                const [followersData, followingData] = await Promise.all([
                    followersRes.json(),
                    followingRes.json()
                ])
                if (!cancelled) {
                    setFollowers(Array.isArray(followersData) ? followersData.length : 0)
                    setFollowing(Array.isArray(followingData) ? followingData.length : 0)
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'errore')
            }
        }
        load()
        return () => { cancelled = true }
    }, [userId])

    const label = followers === null || following === null
        ? 'Caricamento…'
        : `Seguendo ${following} | Followers ${followers}`

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-medium transition text-gray-700 border border-gray-300"
                title="Statistiche follow"
            >{label}</button>
            {open && (
                <div className="absolute z-10 mt-2 w-56 p-3 rounded shadow-lg bg-white border border-gray-200 text-xs">
                    {error && <div className="text-red-600">Errore caricamento</div>}
                    {!error && (
                        <ul className="space-y-1 text-gray-900">
                            <li><span className="font-semibold">Followers:</span> {followers}</li>
                            <li><span className="font-semibold">Seguiti:</span> {following}</li>
                            <li className="text-[10px] text-gray-500 pt-1">Aggiornato ora</li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
