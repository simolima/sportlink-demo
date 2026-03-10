interface Specialization {
    id: string
    name: string
    description?: string
    icon?: string
}

interface Props {
    specializations: Specialization[]
}

export default function StudioSpecializations({ specializations }: Props) {
    if (!specializations || specializations.length === 0) return null

    const useHorizontalScroll = specializations.length > 4

    return (
        <section className="py-16 bg-base-200/50">
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-base-content mb-2 text-center">Aree di Specializzazione</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                {useHorizontalScroll ? (
                    <div className="-mx-4 px-4 overflow-x-auto pb-2">
                        <div className="flex gap-6 min-w-max snap-x snap-mandatory">
                            {specializations.map((spec) => (
                                <div
                                    key={spec.id}
                                    className="glass-widget p-6 rounded-xl hover:shadow-md hover:border-primary/30 transition-all w-[260px] shrink-0 snap-start"
                                >
                                    <div className="text-4xl mb-4">{spec.icon || '⭐'}</div>
                                    <h3 className="text-lg font-bold text-base-content mb-2">{spec.name}</h3>
                                    <p className="text-sm text-secondary leading-relaxed">{spec.description || 'Specializzazione'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                        {specializations.map((spec) => (
                            <div
                                key={spec.id}
                                className="glass-widget p-6 rounded-xl hover:shadow-md hover:border-primary/30 transition-all w-full max-w-sm md:max-w-[300px]"
                            >
                                <div className="text-4xl mb-4">{spec.icon || '⭐'}</div>
                                <h3 className="text-lg font-bold text-base-content mb-2">{spec.name}</h3>
                                <p className="text-sm text-secondary leading-relaxed">{spec.description || 'Specializzazione'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
