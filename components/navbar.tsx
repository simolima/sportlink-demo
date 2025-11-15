"use client"
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const LogoutButton = dynamic(() => import('./logout-button'), { ssr: false })

export default function Navbar() {
    const [loggedIn, setLoggedIn] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        setLoggedIn(Boolean(localStorage.getItem('currentUserId')))
        setIsLoaded(true)
    }, [])

    if (!isLoaded) return null

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-blue-600">SportLink</Link>
                <div className="flex items-center gap-6">
                    {loggedIn ? (
                        <>
                            <Link href="/home" className="text-sm text-gray-600 hover:text-gray-900 transition">Feed</Link>
                            <Link href="/people" className="text-sm text-gray-600 hover:text-gray-900 transition">Scopri</Link>
                            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 transition">Lavoro</Link>
                            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition">Profilo</Link>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">Login</Link>
                            <Link href="/create-profile" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Crea Account</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
