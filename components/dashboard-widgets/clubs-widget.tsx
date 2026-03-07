"use client"
import React from 'react'
import Link from 'next/link'
import { Building2, Activity, MapPin } from 'lucide-react'
import { Club } from '@/lib/types'

interface ClubsWidgetProps {
    clubs: (Club & { memberships?: any[] })[]
    title?: string
    subtitle?: string
    maxItems?: number
    emptyMessage?: string
}

export default function ClubsWidget({
    clubs,
    title = 'I miei Club',
    subtitle = 'Club di cui fai parte',
    maxItems = 5,
    emptyMessage = 'Non sei membro di alcun club'
}: ClubsWidgetProps) {
    const displayedItems = clubs.slice(0, maxItems)

    return (
        <div className="glass-widget rounded-2xl overflow-hidden">
            <div className="glass-widget-header px-6 py-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm glass-subtle-text mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 px-6 text-center">
                    <Building2 className="w-8 h-8 text-secondary/55 mx-auto mb-2" />
                    <p className="glass-subtle-text">{emptyMessage}</p>
                    <Link
                        href="/clubs"
                        className="inline-block mt-3 px-4 py-2 bg-primary hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                        Scopri Club
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-6 py-5">
                    {displayedItems.map((club) => (
                        <Link
                            key={club.id}
                            href={`/clubs/${club.id}`}
                            className="p-4 border border-base-300 rounded-xl bg-base-300/60 hover:border-primary/35 hover:bg-base-300/85 transition"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {club.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white truncate">{club.name}</h4>
                                    <p className="text-sm glass-subtle-text flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {club.city}
                                    </p>
                                    <div className="flex gap-2 mt-2 text-xs glass-quiet-text">
                                        <span>{club.membersCount || 0} membri</span>
                                        {club.sports && (
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3.5 h-3.5 shrink-0 text-secondary/70" />
                                                {club.sports.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {clubs.length > maxItems && (
                <Link
                    href="/clubs"
                    className="block mt-1 mb-5 text-center py-2 text-primary hover:text-brand-700 font-semibold text-sm"
                >
                    Vedi tutti i club ({clubs.length}) →
                </Link>
            )}
        </div>
    )
}
