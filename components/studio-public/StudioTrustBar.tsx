import { StarIcon, ChatBubbleLeftRightIcon, LanguageIcon } from '@heroicons/react/24/solid'
import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    mockData: PublicStudioMockData
}

export default function StudioTrustBar({ mockData }: Props) {
    // Calcolo rating medio dalle recensioni mock
    const avgRating = mockData.reviews.length > 0
        ? (mockData.reviews.reduce((sum, r) => sum + r.rating, 0) / mockData.reviews.length).toFixed(1)
        : '5.0'

    const verifiedReviewsCount = mockData.reviews.filter(r => r.verified).length

    return (
        <div className="bg-base-100 border-y border-base-300 py-6">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-wrap justify-center md:justify-around items-center gap-8">
                    {/* Esperienza */}
                    <div className="text-center">
                        <div className="text-3xl font-bold text-brand-600 mb-1">
                            {mockData.yearsOfExperience}+
                        </div>
                        <div className="text-sm text-secondary uppercase tracking-wide">Anni di esperienza</div>
                    </div>

                    {/* Recensioni */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-3xl font-bold text-base-content">{avgRating}</span>
                            <StarIcon className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="text-sm text-secondary uppercase tracking-wide">
                            {mockData.reviews.length} recensioni ({verifiedReviewsCount} verificate)
                        </div>
                    </div>

                    {/* Lingue */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <LanguageIcon className="h-8 w-8 text-brand-600" />
                            <span className="text-3xl font-bold text-base-content">{mockData.languages.length}</span>
                        </div>
                        <div className="text-sm text-secondary uppercase tracking-wide">Lingue parlate</div>
                    </div>

                    {/* Modalità lavoro */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <ChatBubbleLeftRightIcon className="h-8 w-8 text-brand-600" />
                        </div>
                        <div className="text-sm text-secondary uppercase tracking-wide">
                            {mockData.workModes.includes('in-person') && 'In presenza'}
                            {mockData.workModes.includes('remote') && mockData.workModes.includes('in-person') && ' • '}
                            {mockData.workModes.includes('remote') && 'Online'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
