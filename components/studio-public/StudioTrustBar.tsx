import { StarIcon, ChatBubbleLeftRightIcon, LanguageIcon } from '@heroicons/react/24/solid'

interface Props {
    yearsOfExperience?: number
    languages?: string[]
    workModes?: string[]
    reviews?: Array<{ rating: number; isVerified?: boolean }>
}

export default function StudioTrustBar({ yearsOfExperience, languages = [], workModes = [], reviews = [] }: Props) {
    // Calcolo rating medio dalle recensioni
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '5.0'

    const verifiedReviewsCount = reviews.filter(r => r.isVerified).length

    return (
        <div className="bg-base-100 border-y border-base-300 py-6">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-wrap justify-center md:justify-around items-center gap-8">
                    {/* Esperienza */}
                    {yearsOfExperience !== undefined && (
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand-600 mb-1">
                                {yearsOfExperience}+
                            </div>
                            <div className="text-sm text-secondary uppercase tracking-wide">Anni di esperienza</div>
                        </div>
                    )}

                    {/* Recensioni */}
                    {reviews.length > 0 && (
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-3xl font-bold text-base-content">{avgRating}</span>
                                <StarIcon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="text-sm text-secondary uppercase tracking-wide">
                                {reviews.length} recensioni ({verifiedReviewsCount} verificate)
                            </div>
                        </div>
                    )}

                    {/* Lingue */}
                    {languages.length > 0 && (
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <LanguageIcon className="h-8 w-8 text-brand-600" />
                                <span className="text-3xl font-bold text-base-content">{languages.length}</span>
                            </div>
                            <div className="text-sm text-secondary uppercase tracking-wide">Lingue parlate</div>
                        </div>
                    )}

                    {/* Modalità lavoro */}
                    {workModes.length > 0 && (
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <ChatBubbleLeftRightIcon className="h-8 w-8 text-brand-600" />
                            </div>
                            <div className="text-sm text-secondary uppercase tracking-wide">
                                {workModes.includes('in-person') && 'In presenza'}
                                {workModes.includes('remote') && workModes.includes('in-person') && ' • '}
                                {workModes.includes('remote') && 'Online'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
