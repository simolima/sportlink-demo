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
        <div className="glass-widget rounded-2xl overflow-hidden">
            <div className="glass-widget-header px-6 py-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm glass-subtle-text mt-1">{subtitle}</p>}
            </div>

            {items.length === 0 ? (
                <div className="py-8 px-6 text-center">
                    <div className="text-secondary/55 mb-2">✨</div>
                    <p className="glass-subtle-text">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3 px-6 py-5">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 border border-warning/35 bg-warning/10 rounded-xl flex items-center justify-between gap-4"
                        >
                            <div>
                                <h4 className="font-semibold text-white">{item.title}</h4>
                                {item.description && (
                                    <p className="text-sm glass-subtle-text mt-1">{item.description}</p>
                                )}
                                {item.count !== undefined && (
                                    <p className="text-sm font-semibold text-warning mt-1">
                                        {item.count} {item.count === 1 ? 'elemento' : 'elementi'}
                                    </p>
                                )}
                            </div>
                            {item.actionUrl && (
                                <Link
                                    href={item.actionUrl}
                                    className="px-4 py-2 bg-warning hover:opacity-90 text-base-100 rounded-lg font-semibold text-sm whitespace-nowrap transition"
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
