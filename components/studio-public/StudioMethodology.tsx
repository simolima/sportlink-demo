import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    mockData: PublicStudioMockData
}

export default function StudioMethodology({ mockData }: Props) {
    if (!mockData.methodology) return null

    return (
        <section className="py-16 bg-gradient-to-br from-brand-50 to-white">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Come Lavoro</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                        {mockData.methodology}
                    </p>
                </div>

                {/* Certificazioni */}
                {mockData.certifications && mockData.certifications.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Certificazioni e Formazione</h3>
                        <div className="flex flex-wrap gap-3">
                            {mockData.certifications.map((cert, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-4 py-2 bg-brand-100 text-brand-800 rounded-full text-sm font-medium border border-brand-200"
                                >
                                    {cert}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
