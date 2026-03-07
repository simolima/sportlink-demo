import type { ProfessionalStudio } from '@/lib/types'

interface Props {
    studio: ProfessionalStudio
}

export default function StudioAboutSection({ studio }: Props) {
    if (!studio.description) return null

    return (
        <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Chi sono</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-8" />

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {studio.description}
                    </p>
                </div>

                {studio.owner && (
                    <div className="mt-8 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {studio.owner.avatarUrl && (
                            <img
                                src={studio.owner.avatarUrl}
                                alt={`${studio.owner.firstName} ${studio.owner.lastName}`}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">
                                {studio.owner.firstName} {studio.owner.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                                Titolare dello studio
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
