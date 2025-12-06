"use client"
import React from 'react'
import Link from 'next/link'

interface PendingActionsWidgetProps {
    items: {
        id: string | number
        title: string
        description?: string
        count?: number
        action?: string
        actionUrl?: string
    }[]
    title?: string
    subtitle?: string
    emptyMessage?: string
}

export default function PendingActionsWidget({
    items,
    title = 'Azioni Pendenti',
    subtitle = 'Attività che richiedono la tua attenzione',
    emptyMessage = 'Nessuna azione richiesta'
}: PendingActionsWidgetProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>

            {items.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">✨</div>
                    <p className="text-gray-600">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 border border-amber-100 bg-amber-50 rounded-lg flex items-center justify-between gap-4"
                        >
                            <div>
                                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                {item.description && (
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                {item.count !== undefined && (
                                    <p className="text-sm font-semibold text-amber-700 mt-1">
                                        {item.count} {item.count === 1 ? 'elemento' : 'elementi'}
                                    </p>
                                )}
                            </div>
                            {item.actionUrl && (
                                <Link
                                    href={item.actionUrl}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm whitespace-nowrap transition"
                                >
                                    {item.action || 'Vedi'}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
