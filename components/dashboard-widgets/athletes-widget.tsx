"use client"
import React from 'react'
import Link from 'next/link'
import { User } from '@/lib/types'

interface AthletesWidgetProps {
    athletes: User[]
    title?: string
    subtitle?: string
    maxItems?: number
    emptyMessage?: string
}

export default function AthletesWidget({
    athletes,
    title = 'I miei Atleti',
    subtitle = 'Giocatori assistiti',
    maxItems = 5,
    emptyMessage = 'Non hai atleti affiliati'
}: AthletesWidgetProps) {
    const displayedItems = athletes.slice(0, maxItems)

    return (
        <div className="glass-widget rounded-2xl overflow-hidden">
            <div className="glass-widget-header px-6 py-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm glass-subtle-text mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 px-6 text-center">
                    <div className="text-secondary/55 mb-2">👥</div>
                    <p className="glass-subtle-text">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3 px-6 py-5">
                    {displayedItems.map((athlete) => (
                        <Link
                            key={athlete.id}
                            href={`/profile/${athlete.id}`}
                            className="flex items-center gap-3 p-3 border border-base-300 rounded-xl bg-base-300/60 hover:border-primary/35 hover:bg-base-300/85 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-sprinta-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {athlete.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white">
                                    {athlete.firstName} {athlete.lastName}
                                </p>
                                <p className="text-sm glass-subtle-text">
                                    {athlete.sports?.[0] || 'Sport non specificato'} • {athlete.professionalRole}
                                </p>
                            </div>
                            <div className="text-right text-xs glass-quiet-text">
                                📊 Profilo
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {athletes.length > maxItems && (
                <Link
                    href="/people"
                    className="block mt-1 mb-5 text-center py-2 text-primary hover:text-brand-700 font-semibold text-sm"
                >
                    Vedi tutti ({athletes.length}) →
                </Link>
            )}
        </div>
    )
}
