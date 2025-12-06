"use client"
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'

const LogoutButton = dynamic(() => import('./logout-button'), { ssr: false })
const NotificationBell = dynamic(() => import('./notification-bell'), { ssr: false })

export default function Navbar() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!isAuthenticated) return

        const fetchUnread = async () => {
            try {
                const id = user?.id
                if (!id) return
                const res = await fetch(`/api/messages?userId=${id}`)
                const data = await res.json()
                const total = data.reduce((sum: number, c: any) => sum + (c.unread || 0), 0)
                setUnreadCount(total)
            } catch (e) {
                // silenzioso
            }
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 15000)
        return () => clearInterval(interval)
    }, [isAuthenticated, user])

    if (isLoading) return null

    return (
        <nav className="bg-green-600 shadow-md">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href={isAuthenticated ? "/home" : "/"} className="text-xl font-bold text-white">SPRINTA</Link>
                <div className="flex items-center gap-6">
                    {isAuthenticated && user ? (
                        <>
                            <Link href="/home" className="text-sm text-white hover:text-white/80 transition">Home</Link>
                            <Link href="/people" className="text-sm text-white hover:text-white/80 transition">Scopri</Link>
                            <Link href="/clubs" className="text-sm text-white hover:text-white/80 transition">Società</Link>
                            <Link href="/opportunities" className="text-sm text-white hover:text-white/80 transition">Opportunità</Link>
                            <Link href="/messages" className="relative text-sm text-white hover:text-white/80 transition">
                                Messaggi
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                                )}
                            </Link>
                            <NotificationBell userId={Number(user.id)} />
                            <Link href={`/profile/${user.id}`} className="text-sm text-white hover:text-white/80 transition">Profilo</Link>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-white hover:text-white/80 transition">Login</Link>
                            <Link href="/signup" className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-semibold hover:bg-green-50 transition">Registrati</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
