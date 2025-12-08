"use client"
import { useState, useRef, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'

interface Announcement {
    id: string | number
    title: string
    description?: string
    type: 'opportunity' | 'need' | 'application' | 'request'
    status?: 'active' | 'pending' | 'closed'
    createdAt?: string
}

interface AnnouncementsCarouselProps {
    announcements: Announcement[]
    onAnnouncementClick?: (id: string | number) => void
    title?: string
}

export default function AnnouncementsCarousel({
    announcements,
    onAnnouncementClick,
    title = "Annunci Attivi"
}: AnnouncementsCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(announcements.length > 3)

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setShowLeftArrow(scrollLeft > 0)
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [announcements])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
            setTimeout(checkScroll, 300)
        }
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            opportunity: { bg: 'bg-info/10', border: 'border-info', text: 'text-info' },
            need: { bg: 'bg-warning/10', border: 'border-warning', text: 'text-warning' },
            application: { bg: 'bg-success/10', border: 'border-success', text: 'text-success' },
            request: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
        }
        return colors[type] || colors.opportunity
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            opportunity: 'Opportunità',
            need: 'Ricerca',
            application: 'Candidatura',
            request: 'Richiesta'
        }
        return labels[type] || type
    }

    if (announcements.length === 0) {
        return (
            <div className="bg-base-200 rounded-lg shadow-sm border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4">{title}</h3>
                <div className="text-center py-8 text-secondary/60">
                    <p>Nessun annuncio disponibile</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-base-200 rounded-lg shadow-sm border border-base-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary">{title}</h3>
                <span className="text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full">
                    {announcements.length} {announcements.length === 1 ? 'annuncio' : 'annunci'}
                </span>
            </div>

            {/* Carousel */}
            <div className="relative px-6 py-4">
                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-4 overflow-x-auto scrollbar-hide"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {announcements.map((announcement) => {
                        const colors = getTypeColor(announcement.type)
                        return (
                            <div
                                key={announcement.id}
                                onClick={() => onAnnouncementClick?.(announcement.id)}
                                className={`flex-shrink-0 w-80 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
                            >
                                {/* Type Badge */}
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.text} bg-white border ${colors.border}`}>
                                        {getTypeLabel(announcement.type)}
                                    </span>
                                    {announcement.status && (
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${announcement.status === 'active' ? 'bg-success/20 text-success' :
                                            announcement.status === 'pending' ? 'bg-warning/20 text-warning' :
                                                'bg-base-300 text-secondary/70'
                                            }`}>
                                            {announcement.status === 'active' ? 'Attivo' :
                                                announcement.status === 'pending' ? 'In sospeso' :
                                                    'Chiuso'}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {announcement.title}
                                </h4>

                                {/* Description */}
                                {announcement.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                        {announcement.description}
                                    </p>
                                )}

                                {/* Date */}
                                {announcement.createdAt && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        {new Date(announcement.createdAt).toLocaleDateString('it-IT')}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Navigation Arrows */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-900" />
                    </button>
                )}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5 text-gray-900" />
                    </button>
                )}
            </div>
        </div>
    )
}
