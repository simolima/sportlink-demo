"use client"
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const LogoutButton = dynamic(() => import('./logout-button'), { ssr: false })

export default function Navbar() {
    const [loggedIn, setLoggedIn] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setLoggedIn(Boolean(id))
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (!loggedIn) return
        const fetchUnread = async () => {
            try {
                const id = localStorage.getItem('currentUserId')
                if (!id) return
                const res = await fetch(`/api/messages?userId=${id}`)
                const data = await res.json()
                // data: array conversazioni { peerId, lastMessage, unread }
                const total = data.reduce((sum: number, c: any) => sum + (c.unread || 0), 0)
                setUnreadCount(total)
            } catch (e) {
                // silenzioso
            }
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 15000)
        return () => clearInterval(interval)
    }, [loggedIn])

    if (!isLoaded) return null

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-green-600">SportLink</Link>
                <div className="flex items-center gap-6">
                    {loggedIn ? (
                        <>
                            <Link href="/home" className="text-sm text-gray-600 hover:text-gray-900 transition">Feed</Link>
                            <Link href="/people" className="text-sm text-gray-600 hover:text-gray-900 transition">Scopri</Link>
                            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 transition">Lavoro</Link>
                            <Link href="/messages" className="relative text-sm text-gray-600 hover:text-gray-900 transition">
                                Messaggi
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                                )}
                            </Link>
                            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition">Profilo</Link>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">Login</Link>
                            <Link href="/create-profile" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">Crea Account</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
