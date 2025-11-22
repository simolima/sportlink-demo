'use client'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

interface Season {
    id?: number
    team: string
    teamLogo?: string
    year: string
    description?: string
}

interface ProfessionalSeasonsProps {
    seasons: Season[]
    title?: string
}

export default function ProfessionalSeasons({ seasons, title = "Stagioni Professionali" }: ProfessionalSeasonsProps) {
    if (!seasons || seasons.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {seasons.map((season, index) => (
                    <div 
                        key={season.id || index}
                        className="p-4 hover:bg-gray-50 transition cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            {/* Team Logo */}
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                                {season.teamLogo ? (
                                    <img 
                                        src={season.teamLogo} 
                                        alt={season.team}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{season.team.charAt(0)}</span>
                                )}
                            </div>
                            
                            {/* Season Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">{season.team}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{season.year}</p>
                                {season.description && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                        {season.description}
                                    </p>
                                )}
                            </div>
                            
                            {/* Arrow */}
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition shrink-0" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
