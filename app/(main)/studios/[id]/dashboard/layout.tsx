'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
    CalendarDaysIcon,
    ChartBarIcon,
    ClockIcon,
    Cog6ToothIcon,
    Squares2X2Icon,
    WrenchScrewdriverIcon,
    SparklesIcon,
    QuestionMarkCircleIcon,
    StarIcon,
} from '@heroicons/react/24/outline'

type NavItem = {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
}

export default function StudioDashboardLayout({ children }: { children: React.ReactNode }) {
    const params = useParams()
    const pathname = usePathname()
    const studioId = params.id as string

    const items: NavItem[] = [
        { href: `/studios/${studioId}/dashboard/overview`, label: 'Panoramica', icon: ChartBarIcon },
        { href: `/studios/${studioId}/dashboard/calendar`, label: 'Calendario', icon: CalendarDaysIcon },
        { href: `/studios/${studioId}/dashboard/availability`, label: 'Disponibilità', icon: ClockIcon },
        { href: `/studios/${studioId}/dashboard/services`, label: 'Servizi', icon: WrenchScrewdriverIcon },
        { href: `/studios/${studioId}/dashboard/specializations`, label: 'Specializzazioni', icon: SparklesIcon },
        { href: `/studios/${studioId}/dashboard/faqs`, label: 'FAQ', icon: QuestionMarkCircleIcon },
        { href: `/studios/${studioId}/dashboard/reviews`, label: 'Recensioni', icon: StarIcon },
        { href: `/studios/${studioId}/dashboard/bookings`, label: 'Prenotazioni', icon: Squares2X2Icon },
        { href: `/studios/${studioId}/dashboard/settings`, label: 'Impostazioni', icon: Cog6ToothIcon },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px,1fr]">
                <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-fit">
                    <p className="mb-4 text-sm font-semibold text-gray-700">Dashboard Studio</p>
                    <nav className="space-y-1">
                        {items.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${isActive
                                        ? 'bg-brand-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <Link
                            href={`/studios/${studioId}`}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Vai alla pagina pubblica dello studio
                        </Link>
                    </div>
                </aside>
                <main>{children}</main>
            </div>
        </div>
    )
}
