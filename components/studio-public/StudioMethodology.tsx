interface Props {
    methodology?: string
    certifications?: string[]
}

export default function StudioMethodology({ methodology, certifications = [] }: Props) {
    if (!methodology && certifications.length === 0) return null

    return (
        <section className="py-16 bg-base-100">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-base-content mb-2 text-center">Come Lavoro</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                {methodology && (
                    <div className="glass-widget p-8 rounded-xl">
                        <p className="text-secondary leading-relaxed whitespace-pre-line text-lg">
                            {methodology}
                        </p>
                    </div>
                )}

                {/* Certificazioni */}
                {certifications && certifications.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-base-content mb-4">Certificazioni e Formazione</h3>
                        <div className="flex flex-wrap gap-3">
                            {certifications.map((cert, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-4 py-2 bg-base-200 text-primary rounded-full text-sm font-medium border border-primary/30"
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
