import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    mockData: PublicStudioMockData
}

export default function StudioSpecializations({ mockData }: Props) {
    if (mockData.specializations.length === 0) return null

    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Aree di Specializzazione</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mockData.specializations.map((spec, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all"
                        >
                            <div className="text-4xl mb-4">{spec.icon}</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{spec.name}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{spec.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
