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
                    {/* Indirizzo con Mappa e Telefono */}
                    {studio.address && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                            {/* Header con Indirizzo e Telefono */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                {/* Indirizzo a sinistra */}
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

                                {/* Telefono a destra */}
                                {studio.phone && (
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
                                )}
                            </div>

                            {/* Google Maps Embed */}
                            <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
                                <iframe
                                    title="Posizione studio"
                                    width="100%"
                                    height="300"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(studio.address)}&zoom=15`}
                                />
                            </div>

                            {/* Link Indicazioni */}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(studio.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <MapPinIcon className="h-4 w-4" />
                                Ottieni indicazioni
                            </a>
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
