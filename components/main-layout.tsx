"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface MainLayoutProps {
    children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname()
    const { user, isAuthenticated } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Check se il profilo è completato (sport + ruolo)
    const sport = typeof window !== 'undefined' ? localStorage.getItem('currentUserSport') : null
    const role = typeof window !== 'undefined' ? localStorage.getItem('currentUserRole') : null
    const profileComplete = sport && role && user?.professionalRole

    // Non mostrare layout durante setup phase (login, sport, ruolo)
    if (!isAuthenticated || !profileComplete) {
        return <>{children}</>
    }

    const navItems = [
        { label: 'Dashboard', href: '/home', icon: '📊' },
        { label: 'Network', href: '/people', icon: '👥' },
        { label: 'Opportunità', href: '/opportunities', icon: '💼' },
        { label: 'Club', href: '/clubs', icon: '⚽' },
        { label: 'Messaggi', href: '/messages', icon: '💬' }
    ]

    const isActive = (href: string) => pathname === href

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <Link href="/home" className="text-2xl font-bold text-green-600">SPRINTA</Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                                ? 'bg-green-100 text-green-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Profile Card */}
                {user && (
                    <div className="p-4 border-t border-gray-200 bg-green-50">
                        <Link
                            href={`/profile/${user.id}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-100 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                                {user.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-gray-900">{user.firstName}</p>
                                <p className="text-gray-600 text-xs">{user.professionalRole}</p>
                            </div>
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar Mobile */}
                <header className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                    <Link href="/home" className="text-xl font-bold text-green-600">SPRINTA</Link>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${isActive(item.href)
                                    ? 'bg-green-100 text-green-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
