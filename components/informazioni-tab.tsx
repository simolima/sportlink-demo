'use client'
import ProfileStats from './profile-stats'
import ProfessionalSeasons from './professional-seasons'
import ProfessionalExperiences from './professional-experiences'
import { EnvelopeIcon, CakeIcon, MapPinIcon, LanguageIcon } from '@heroicons/react/24/outline'

interface InformazioniTabProps {
    user: any
    stats?: any[]
    seasons?: any[]
}

export default function InformazioniTab({ user, stats, seasons }: InformazioniTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
                {stats && stats.length > 0 && (
                    <ProfileStats customStats={stats} />
                )}

                {/* Personal Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Informazioni Personali</h2>
                    <div className="space-y-3">
                        {user.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">{user.email}</span>
                            </div>
                        )}
                        {user.birthDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <CakeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    {new Date(user.birthDate + 'T00:00:00').toLocaleDateString('it-IT', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                        {user.city && (
                            <div className="flex items-center gap-3 text-sm">
                                <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">{user.city}</span>
                            </div>
                        )}
                        {user.languages && user.languages.length > 0 && (
                            <div className="flex items-center gap-3 text-sm">
                                <LanguageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">{user.languages.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column - Professional Info */}
            <div className="lg:col-span-2 space-y-6">
                {/* Professional Seasons */}
                {seasons && seasons.length > 0 && (
                    <ProfessionalSeasons seasons={seasons} />
                )}

                {/* Professional Experiences */}
                {user.experiences && user.experiences.length > 0 && (
                    <ProfessionalExperiences experiences={user.experiences} />
                )}

                {/* No info message */}
                {(!seasons || seasons.length === 0) && (!user.experiences || user.experiences.length === 0) && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500">Nessuna informazione professionale disponibile</p>
                    </div>
                )}
            </div>
        </div>
    )
}
