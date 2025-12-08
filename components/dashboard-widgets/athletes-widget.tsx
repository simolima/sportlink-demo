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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>

            {displayedItems.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">👥</div>
                    <p className="text-gray-600">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedItems.map((athlete) => (
                        <Link
                            key={athlete.id}
                            href={`/profile/${athlete.id}`}
                            className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {athlete.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">
                                    {athlete.firstName} {athlete.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {athlete.sport} • {athlete.professionalRole}
                                </p>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                📊 Profilo
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {athletes.length > maxItems && (
                <Link
                    href="/people"
                    className="block mt-4 text-center py-2 text-primary hover:text-blue-700 font-semibold text-sm"
                >
                    Vedi tutti ({athletes.length}) →
                </Link>
            )}
        </div>
    )
}
