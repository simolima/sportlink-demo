"use client"
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    HomeIcon as HomeOutline,
    UserGroupIcon as UserGroupOutline,
    BuildingOfficeIcon as BuildingOfficeOutline,
    BuildingOffice2Icon as BuildingOffice2Outline,
    BriefcaseIcon as BriefcaseOutline,
    ChatBubbleLeftRightIcon as ChatBubbleOutline,
    LinkIcon as LinkOutline,
    IdentificationIcon as IdentificationOutline,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import {
    HomeIcon as HomeSolid,
    UserGroupIcon as UserGroupSolid,
    BuildingOfficeIcon as BuildingOfficeSolid,
    BuildingOffice2Icon as BuildingOffice2Solid,
    BriefcaseIcon as BriefcaseSolid,
    ChatBubbleLeftRightIcon as ChatBubbleSolid,
    LinkIcon as LinkSolid,
    IdentificationIcon as IdentificationSolid,
} from '@heroicons/react/24/solid'

const NotificationBell = dynamic(() => import('./notification-bell'), { ssr: false })
const ProfileDropdown = dynamic(() => import('./ui/ProfileDropdown'), { ssr: false })

export default function Navbar() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const pathname = usePathname()

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href)
    const navCls = (href: string, exact = false) =>
        `group relative flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition ${isActive(href, exact) ? 'text-white bg-brand-600/25 border border-brand-400/30' : 'text-secondary/80 hover:text-white hover:bg-base-300/45 border border-transparent'}`

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
        <nav className="sticky top-0 z-40 border-b border-base-300/50 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                <div className="glass-nav rounded-2xl px-4 md:px-5 py-3 flex items-center gap-4">
                    {/* Logo + ricerca */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                        <Link href={isAuthenticated ? '/home' : '/'} className="flex flex-col items-center text-white font-bold leading-tight">
                            <span className="text-sm md:text-base tracking-[0.18em] uppercase">SPRINTA</span>
                            <span className="text-[11px] text-secondary/85">Sport Network</span>
                        </Link>
                        <div className="hidden lg:flex items-center bg-base-200/65 border border-base-300/70 rounded-xl px-3 py-1.5 gap-2 w-56 backdrop-blur">
                            <MagnifyingGlassIcon className="w-5 h-5 text-secondary/60" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ricerca globale"
                                className="bg-transparent text-secondary/90 placeholder:text-secondary/45 focus:outline-none text-sm w-full"
                            />
                        </div>
                    </div>

                    {/* Nav centrale */}
                    <div className="flex-1 flex justify-center">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
                                <Link href="/home" className={navCls('/home', true)}>
                                    {isActive('/home', true) ? <HomeSolid className="w-5 h-5" /> : <HomeOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Home</span>
                                </Link>
                                <Link href="/professionals" className={navCls('/professionals')}>
                                    {isActive('/professionals') ? <UserGroupSolid className="w-5 h-5" /> : <UserGroupOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Scopri</span>
                                </Link>
                                <Link href="/clubs" className={navCls('/clubs')}>
                                    {isActive('/clubs') ? <BuildingOfficeSolid className="w-5 h-5" /> : <BuildingOfficeOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Società</span>
                                </Link>
                                <Link href="/studios" className={navCls('/studios')}>
                                    {isActive('/studios') ? <BuildingOffice2Solid className="w-5 h-5" /> : <BuildingOffice2Outline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Studi</span>
                                </Link>
                                <Link href="/opportunities" className={navCls('/opportunities')}>
                                    {isActive('/opportunities') ? <BriefcaseSolid className="w-5 h-5" /> : <BriefcaseOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Opportunità</span>
                                </Link>
                                {user.professionalRole === 'agent' && (
                                    <Link href="/agent/affiliations" className={navCls('/agent/affiliations')}>
                                        {isActive('/agent/affiliations') ? <LinkSolid className="w-5 h-5" /> : <LinkOutline className="w-5 h-5" />}
                                        <span className="hidden lg:inline">Affiliazioni</span>
                                    </Link>
                                )}
                                {user.professionalRole === 'player' && (
                                    <Link href="/player/affiliations" className={navCls('/player/affiliations')}>
                                        {isActive('/player/affiliations') ? <IdentificationSolid className="w-5 h-5" /> : <IdentificationOutline className="w-5 h-5" />}
                                        <span className="hidden lg:inline">Rappresentanza</span>
                                    </Link>
                                )}
                                <Link href="/messages" className={`relative ${navCls('/messages')}`}>
                                    {isActive('/messages') ? <ChatBubbleSolid className="w-5 h-5" /> : <ChatBubbleOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Messaggi</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg">{unreadCount}</span>
                                    )}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
                                <Link href="/home" className={navCls('/home', true)}>
                                    {isActive('/home', true) ? <HomeSolid className="w-5 h-5" /> : <HomeOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Home</span>
                                </Link>
                                <Link href="/professionals" className={navCls('/professionals')}>
                                    {isActive('/professionals') ? <UserGroupSolid className="w-5 h-5" /> : <UserGroupOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Scopri</span>
                                </Link>
                                <Link href="/clubs" className={navCls('/clubs')}>
                                    {isActive('/clubs') ? <BuildingOfficeSolid className="w-5 h-5" /> : <BuildingOfficeOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Società</span>
                                </Link>
                                <Link href="/studios" className={navCls('/studios')}>
                                    {isActive('/studios') ? <BuildingOffice2Solid className="w-5 h-5" /> : <BuildingOffice2Outline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Studi</span>
                                </Link>
                                <Link href="/opportunities" className={navCls('/opportunities')}>
                                    {isActive('/opportunities') ? <BriefcaseSolid className="w-5 h-5" /> : <BriefcaseOutline className="w-5 h-5" />}
                                    <span className="hidden lg:inline">Opportunità</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Azioni a destra */}
                    <div className="flex items-center gap-3 shrink-0">
                        {isAuthenticated && user ? (
                            <>
                                <NotificationBell userId={String(user.id)} />
                                <ProfileDropdown />
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="px-3 py-1.5 btn btn-ghost btn-sm text-secondary hover:text-white hover:bg-base-300/40">Login</Link>
                                <Link href="/signup" className="px-4 py-2 btn btn-primary btn-sm">Registrati</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
