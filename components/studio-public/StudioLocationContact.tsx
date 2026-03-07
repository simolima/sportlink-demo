import { MapPinIcon, PhoneIcon, GlobeAltIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import type { ProfessionalStudio } from '@/lib/types'

interface Props {
    studio: ProfessionalStudio
}

export default function StudioLocationContact({ studio }: Props) {
    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Dove Trovarmi</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Indirizzo */}
                    {studio.address && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-brand-100 rounded-lg">
                                    <MapPinIcon className="h-6 w-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Indirizzo</h3>
                                    <p className="text-gray-700">{studio.address}</p>
                                    {studio.city && <p className="text-gray-700">{studio.city}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Telefono */}
                    {studio.phone && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-brand-100 rounded-lg">
                                    <PhoneIcon className="h-6 w-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Telefono</h3>
                                    <a
                                        href={`tel:${studio.phone}`}
                                        className="text-brand-600 hover:text-brand-700 font-medium"
                                    >
                                        {studio.phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sito web */}
                    {studio.website && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-brand-100 rounded-lg">
                                    <GlobeAltIcon className="h-6 w-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Sito Web</h3>
                                    <a
                                        href={studio.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-600 hover:text-brand-700 font-medium break-words"
                                    >
                                        {studio.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email - Removed: email not in ProfessionalStudio.owner type */}
                </div>
            </div>
        </section>
    )
}
