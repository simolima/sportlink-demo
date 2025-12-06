"use client"
import React from 'react'
import Link from 'next/link'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">🏛️</div>
                    <p className="text-gray-600">{emptyMessage}</p>
                    <Link
                        href="/clubs"
                        className="inline-block mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                        Scopri Club
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedItems.map((club) => (
                        <Link
                            key={club.id}
                            href={`/clubs/${club.id}`}
                            className="p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {club.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">{club.name}</h4>
                                    <p className="text-sm text-gray-600">📍 {club.city}</p>
                                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                                        <span>{club.membersCount || 0} membri</span>
                                        {club.sports && <span>⚽ {club.sports.join(', ')}</span>}
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
                    className="block mt-4 text-center py-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                >
                    Vedi tutti i club ({clubs.length}) →
                </Link>
            )}
        </div>
    )
}
