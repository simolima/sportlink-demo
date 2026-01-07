"use client"
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    HomeIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

const LogoutButton = dynamic(() => import('./logout-button'), { ssr: false })
const NotificationBell = dynamic(() => import('./notification-bell'), { ssr: false })

export default function Navbar() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

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
            } catch {
                // silenzioso
            }
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 15000)
        return () => clearInterval(interval)
    }, [isAuthenticated, user])

    const handleSearch = () => {
        const q = searchQuery.trim()
        if (!q) return
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    if (isLoading) return null

    return (
        <nav className="bg-base-100 shadow-md border-b border-base-300">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
                {/* Logo + ricerca */}
                <div className="flex items-center gap-4 min-w-[220px]">
                    <Link href={isAuthenticated ? '/home' : '/'} className="flex flex-col items-center text-white font-bold leading-tight">
                        <span className="text-sm md:text-base tracking-[0.18em] uppercase">SPRINTA</span>
                        <span className="text-[11px] text-white/80">Sport Network</span>
                    </Link>
                    <div className="hidden md:flex items-center bg-base-200 border border-base-300 rounded-lg px-3 py-1.5 gap-2 w-56">
                        <MagnifyingGlassIcon className="w-5 h-5 text-secondary" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ricerca globale"
                            className="bg-transparent text-secondary placeholder:text-secondary/60 focus:outline-none text-sm w-full"
                        />
                    </div>
                </div>

                {/* Nav centrale con icona sopra label */}
                <div className="flex-1 flex justify-center">
                    {isAuthenticated && user ? (
                        <div className="flex items-center gap-4 md:gap-6">
                            <Link href="/home" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <HomeIcon className="w-5 h-5" />
                                <span className="mt-1">Home</span>
                            </Link>
                            <Link href="/professionals" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <UserGroupIcon className="w-5 h-5" />
                                <span className="mt-1">Scopri</span>
                            </Link>
                            <Link href="/clubs" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <BuildingOfficeIcon className="w-5 h-5" />
                                <span className="mt-1">Società</span>
                            </Link>
                            <Link href="/opportunities" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <BriefcaseIcon className="w-5 h-5" />
                                <span className="mt-1">Opportunità</span>
                            </Link>
                            {user.professionalRole === 'Agent' && (
                                <Link href="/agent/affiliations" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                    <UserGroupIcon className="w-5 h-5" />
                                    <span className="mt-1">Affiliazioni</span>
                                </Link>
                            )}
                            {user.professionalRole === 'Player' && (
                                <Link href="/player/affiliations" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                    <UserCircleIcon className="w-5 h-5" />
                                    <span className="mt-1">Rappresentanza</span>
                                </Link>
                            )}
                            <Link href="/messages" className="relative flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                <span className="mt-1">Messaggi</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                )}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 md:gap-6">
                            <Link href="/home" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <HomeIcon className="w-5 h-5" />
                                <span className="mt-1">Home</span>
                            </Link>
                            <Link href="/professionals" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <UserGroupIcon className="w-5 h-5" />
                                <span className="mt-1">Scopri</span>
                            </Link>
                            <Link href="/clubs" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <BuildingOfficeIcon className="w-5 h-5" />
                                <span className="mt-1">Società</span>
                            </Link>
                            <Link href="/opportunities" className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <BriefcaseIcon className="w-5 h-5" />
                                <span className="mt-1">Opportunità</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Azioni a destra */}
                <div className="flex items-center gap-4">
                    {isAuthenticated && user ? (
                        <>
                            <NotificationBell userId={Number(user.id)} />
                            <Link href={`/profile/${user.id}`} className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition">
                                <UserCircleIcon className="w-5 h-5" />
                                <span className="mt-1">Profilo</span>
                            </Link>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="px-3 py-1.5 btn btn-primary btn-sm">Login</Link>
                            <Link href="/signup" className="px-4 py-2 btn btn-primary btn-sm">Registrati</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
