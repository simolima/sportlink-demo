import { CheckCircleIcon } from '@heroicons/react/24/solid'
import type { ProfessionalStudio } from '@/lib/types'

interface Props {
    studio: ProfessionalStudio
}

export default function StudioServicesSection({ studio }: Props) {
    if (studio.servicesOffered.length === 0) return null

    return (
        <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Servizi Offerti</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studio.servicesOffered.map((service, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-3 p-4 rounded-lg hover:bg-brand-50 transition-colors"
                        >
                            <CheckCircleIcon className="h-6 w-6 text-brand-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-800 font-medium">{service}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
