import { MapPinIcon, PhoneIcon, GlobeAltIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import type { ProfessionalStudio } from '@/lib/types'

interface Props {
    studio: ProfessionalStudio
}

export default function StudioLocationContact({ studio }: Props) {
    return (
        <section className="py-16 bg-base-200/50">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-base-content mb-2 text-center">Dove Trovarmi</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Indirizzo con Mappa e Telefono */}
                    {studio.address && (
                        <div className="glass-widget p-6 rounded-xl md:col-span-2">
                            {/* Header con Indirizzo e Telefono */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                {/* Indirizzo a sinistra */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                                        <MapPinIcon className="h-6 w-6 text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base-content mb-1">Indirizzo</h3>
                                        <p className="text-secondary">{studio.address}</p>
                                        {studio.city && <p className="text-secondary">{studio.city}</p>}
                                    </div>
                                </div>

                                {/* Telefono a destra */}
                                {studio.phone && (
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                                            <PhoneIcon className="h-6 w-6 text-brand-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base-content mb-1">Telefono</h3>
                                            <a
                                                href={`tel:${studio.phone}`}
                                                className="text-primary hover:text-primary/80 font-medium"
                                            >
                                                {studio.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Google Maps Embed */}
                            <div className="rounded-lg overflow-hidden border border-base-300 mb-3">
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
                                className="btn btn-primary btn-sm"
                            >
                                <MapPinIcon className="h-4 w-4" />
                                Ottieni indicazioni
                            </a>
                        </div>
                    )}

                    {/* Sito web */}
                    {studio.website && (
                        <div className="glass-widget p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                                    <GlobeAltIcon className="h-6 w-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base-content mb-1">Sito Web</h3>
                                    <a
                                        href={studio.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 font-medium break-words"
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
