'use client'
import { ChevronRightIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

interface Experience {
    id?: number
    title: string
    company?: string
    from: string
    to?: string
    description?: string
    location?: string
}

interface ProfessionalExperiencesProps {
    experiences: Experience[]
    title?: string
}

export default function ProfessionalExperiences({ 
    experiences, 
    title = "Esperienze Professionali" 
}: ProfessionalExperiencesProps) {
    if (!experiences || experiences.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <span className="text-sm text-gray-500">
                        {experiences.length} {experiences.length === 1 ? 'esperienza' : 'esperienze'}
                    </span>
                </div>
            </div>
            <div className="divide-y divide-gray-200">
                {experiences.map((exp, index) => (
                    <div 
                        key={exp.id || index}
                        className="p-4 hover:bg-gray-50 transition cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                                <BriefcaseIcon className="w-6 h-6" />
                            </div>
                            
                            {/* Experience Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">
                                    {exp.title}
                                    {exp.company && (
                                        <span className="font-normal text-gray-600"> · {exp.company}</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {exp.from} — {exp.to || 'Presente'}
                                    {exp.location && ` · ${exp.location}`}
                                </p>
                                {exp.description && (
                                    <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                                        {exp.description}
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
