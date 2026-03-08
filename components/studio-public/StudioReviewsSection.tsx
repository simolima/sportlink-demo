import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    mockData: PublicStudioMockData
}

export default function StudioReviewsSection({ mockData }: Props) {
    if (mockData.reviews.length === 0) return null

    // Calcolo rating medio
    const avgRating = (mockData.reviews.reduce((sum, r) => sum + r.rating, 0) / mockData.reviews.length).toFixed(1)

    return (
        <section className="py-16 bg-base-100">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-base-content mb-2">Recensioni</h2>
                    <div className="w-16 h-1 bg-brand-600 rounded-full mb-4 mx-auto" />
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon
                                    key={i}
                                    className={`h-6 w-6 ${i < Math.round(Number(avgRating)) ? 'text-yellow-500' : 'text-secondary/40'}`}
                                />
                            ))}
                        </div>
                        <span className="text-2xl font-bold text-base-content">{avgRating}</span>
                        <span className="text-secondary">({mockData.reviews.length} recensioni)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockData.reviews.map((review, idx) => (
                        <div
                            key={idx}
                            className="bg-base-200 p-6 rounded-xl border border-base-300 hover:shadow-md transition-shadow"
                        >
                            {/* Rating + Verified */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500' : 'text-secondary/40'}`}
                                        />
                                    ))}
                                </div>
                                {review.verified && (
                                    <div className="flex items-center gap-1">
                                        <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
                                        <span className="text-xs text-primary font-medium">Verificata</span>
                                    </div>
                                )}
                            </div>

                            {/* Testo recensione */}
                            <p className="text-secondary leading-relaxed mb-4 text-sm">"{review.text}"</p>

                            {/* Autore e data */}
                            <div className="flex items-center justify-between text-xs text-secondary">
                                <span className="font-medium">{review.clientName}</span>
                                <span>{new Date(review.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
