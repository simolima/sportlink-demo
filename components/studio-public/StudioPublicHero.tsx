import { BuildingOffice2Icon, MapPinIcon, PhoneIcon, GlobeAltIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import type { ProfessionalStudio } from '@/lib/types'
import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    studio: ProfessionalStudio
    mockData: PublicStudioMockData | null
    onBookingClick: () => void
    onCallClick?: () => void
    isAuthenticated: boolean
}

export default function StudioPublicHero({ studio, mockData, onBookingClick, onCallClick, isAuthenticated }: Props) {
    const roleLabels = {
        physio: 'Fisioterapista',
        nutritionist: 'Nutrizionista',
        athletic_trainer: 'Preparatore Atletico'
    }

    return (
        <div className="bg-gradient-to-b from-brand-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Logo/Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xl border-4 border-white">
                            {studio.logoUrl ? (
                                <img src={studio.logoUrl} alt={studio.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <BuildingOffice2Icon className="h-16 w-16 text-white" />
                            )}
                        </div>
                    </div>

                    {/* Info principale */}
                    <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                            <h1 className="text-4xl font-bold text-gray-900">{studio.name}</h1>
                            {studio.owner && (
                                <CheckBadgeIcon className="h-7 w-7 text-brand-600 flex-shrink-0" title="Profilo verificato" />
                            )}
                        </div>

                        {studio.owner && (
                            <p className="text-xl text-gray-700 mb-2">
                                {roleLabels[studio.owner.roleId as keyof typeof roleLabels] || 'Professionista'}
                            </p>
                        )}

                        {/* Badge esperienza e lingue */}
                        {mockData && (
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-800 rounded-full text-sm font-medium">
                                    🎯 {mockData.yearsOfExperience} anni di esperienza
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                    🌍 {mockData.languages.join(', ')}
                                </span>
                                {mockData.workModes.includes('remote') && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                        💻 Consulenze online
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Contatti in evidenza */}
                        <div className="flex flex-wrap gap-4 mb-6 text-gray-600">
                            {studio.city && (
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-5 w-5 text-brand-600" />
                                    <span className="text-sm font-medium">{studio.city}</span>
                                </div>
                            )}
                            {studio.phone && (
                                <a href={`tel:${studio.phone}`} className="flex items-center gap-2 hover:text-brand-600 transition">
                                    <PhoneIcon className="h-5 w-5 text-brand-600" />
                                    <span className="text-sm font-medium">{studio.phone}</span>
                                </a>
                            )}
                            {studio.website && (
                                <a href={studio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-600 transition">
                                    <GlobeAltIcon className="h-5 w-5 text-brand-600" />
                                    <span className="text-sm font-medium">Sito web</span>
                                </a>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onBookingClick}
                                className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition shadow-lg flex items-center gap-2"
                            >
                                <CalendarDaysIcon className="h-5 w-5" />
                                {isAuthenticated ? 'Prenota Visita' : 'Accedi per prenotare'}
                            </button>
                            {studio.phone && onCallClick && (
                                <button
                                    onClick={onCallClick}
                                    className="px-8 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-semibold hover:bg-brand-50 transition"
                                >
                                    Chiama ora
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
