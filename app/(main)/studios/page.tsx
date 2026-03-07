'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BuildingOffice2Icon, MagnifyingGlassIcon, MapPinIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { MEDICAL_ROLES, type ProfessionalStudio } from '@/lib/types'

export default function StudiosPage() {
    const { user } = useRequireAuth(false)
    const router = useRouter()
    const [studios, setStudios] = useState<ProfessionalStudio[]>([])
    const [filtered, setFiltered] = useState<ProfessionalStudio[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [city, setCity] = useState('')

    const isMedical = user?.professionalRole && MEDICAL_ROLES.includes(user.professionalRole as any)

    useEffect(() => {
        fetch('/api/studios')
            .then(r => r.json())
            .then(data => {
                setStudios(Array.isArray(data) ? data : [])
                setFiltered(Array.isArray(data) ? data : [])
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = studios
        if (search) result = result.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.description?.toLowerCase().includes(search.toLowerCase())
        )
        if (city) result = result.filter(s =>
            s.city?.toLowerCase().includes(city.toLowerCase())
        )
        setFiltered(result)
    }, [search, city, studios])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Studi Professionali</h1>
                        <p className="text-gray-600">Fisioterapisti, nutrizionisti e preparatori atletici</p>
                    </div>
                    {isMedical && (
                        <button
                            onClick={() => router.push('/studios/create')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <BuildingOffice2Icon className="h-5 w-5" />
                            Crea Studio
                        </button>
                    )}
                </div>

                {/* Filtri */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cerca studio..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtra per città..."
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Nessuno studio trovato</h3>
                        <p className="text-gray-500 mt-1">Prova a cambiare i filtri di ricerca</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(studio => (
                            <Link
                                key={studio.id}
                                href={`/studios/${studio.id}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100"
                            >
                                {/* Logo o placeholder */}
                                <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    {studio.logoUrl ? (
                                        <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <BuildingOffice2Icon className="h-16 w-16 text-white/70" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-lg">{studio.name}</h3>
                                    {studio.owner && (
                                        <p className="text-sm text-green-600 font-medium mt-0.5">
                                            {studio.owner.firstName} {studio.owner.lastName}
                                        </p>
                                    )}
                                    {studio.city && (
                                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
                                            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                            <span>{studio.city}</span>
                                        </div>
                                    )}
                                    {studio.description && (
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{studio.description}</p>
                                    )}
                                    {studio.servicesOffered.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {studio.servicesOffered.slice(0, 3).map((s, i) => (
                                                <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                                                    {s}
                                                </span>
                                            ))}
                                            {studio.servicesOffered.length > 3 && (
                                                <span className="text-xs text-gray-400">+{studio.servicesOffered.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                                        {studio.phone && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <PhoneIcon className="h-3.5 w-3.5" /> {studio.phone}
                                            </span>
                                        )}
                                        {studio.website && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <GlobeAltIcon className="h-3.5 w-3.5" /> Sito web
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
