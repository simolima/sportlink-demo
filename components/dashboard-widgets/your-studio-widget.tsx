'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BuildingOffice2Icon, CalendarDaysIcon, UserGroupIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

interface Studio {
    id: string
    name: string
    city?: string
    appointmentsCount?: number
    clientsCount?: number
}

interface YourStudioWidgetProps {
    userId: string
}

export default function YourStudioWidget({ userId }: YourStudioWidgetProps) {
    const [studio, setStudio] = useState<Studio | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/studios?ownerId=${userId}`)
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : []
                if (list.length > 0) setStudio(list[0])
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [userId])

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
                </div>
            </div>
        )
    }

    if (!studio) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Il tuo Studio</h3>
                            <p className="text-xs text-gray-500">La tua pagina professionale</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-8 text-center">
                    <BuildingOffice2Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-4">Non hai ancora uno studio</p>
                    <Link
                        href="/studios/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        Crea il tuo Studio
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                        <BuildingOffice2Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Il tuo Studio</h3>
                        <p className="text-xs text-gray-500">{studio.city || 'La tua pagina professionale'}</p>
                    </div>
                </div>
            </div>

            {/* Studio info */}
            <div className="px-6 py-4">
                <p className="font-semibold text-gray-900 mb-4">{studio.name}</p>
                <div className="flex gap-3">
                    <Link
                        href={`/studios/${studio.id}`}
                        className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                    >
                        Pagina pubblica
                    </Link>
                    <Link
                        href={`/studios/${studio.id}/dashboard`}
                        className="flex-1 text-center px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition flex items-center justify-center gap-1.5"
                    >
                        <CalendarDaysIcon className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
