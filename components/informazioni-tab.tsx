'use client'

interface InformazioniTabProps {
    user: any
    seasons?: any[]
}

export default function InformazioniTab({ user, seasons }: InformazioniTabProps) {
    return (
        <div className="max-w-4xl space-y-8">
            {/* Professional Seasons */}
            {seasons && seasons.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Stagioni Professionali</h2>
                    <div className="space-y-4">
                        {seasons.map((season: any) => (
                            <div key={season.id} className="border-l-4 border-green-600 pl-4 py-3">
                                <h3 className="text-lg font-semibold text-gray-900">{season.team}</h3>
                                <p className="text-sm text-gray-500 mt-1">{season.year}</p>
                                {season.description && (
                                    <p className="text-gray-700 mt-2">{season.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* About Section */}
            {user.bio && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Chi Sono</h2>
                    <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </section>
            )}

            {/* Additional Info */}
            <section className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Informazioni Personali</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {user.city && (
                        <div>
                            <span className="text-gray-600">Città:</span>
                            <p className="font-semibold text-gray-900">{user.city}</p>
                        </div>
                    )}
                    {user.dateOfBirth && (
                        <div>
                            <span className="text-gray-600">Data di Nascita:</span>
                            <p className="font-semibold text-gray-900">{new Date(user.dateOfBirth).toLocaleDateString('it-IT')}</p>
                        </div>
                    )}
                    {user.languages && user.languages.length > 0 && (
                        <div>
                            <span className="text-gray-600">Lingue:</span>
                            <p className="font-semibold text-gray-900">{user.languages.join(', ')}</p>
                        </div>
                    )}
                    {user.height && (
                        <div>
                            <span className="text-gray-600">Altezza:</span>
                            <p className="font-semibold text-gray-900">{user.height} cm</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
