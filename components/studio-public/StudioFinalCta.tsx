import { CalendarDaysIcon } from '@heroicons/react/24/outline'

interface Props {
    onBookingClick: () => void
}

export default function StudioFinalCta({ onBookingClick }: Props) {
    return (
        <section className="py-16 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Pronto a Iniziare il Tuo Percorso?
                </h2>
                <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
                    Prenota subito una visita per discutere i tuoi obiettivi e costruire insieme un piano personalizzato.
                </p>
                <button
                    onClick={onBookingClick}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                    <CalendarDaysIcon className="h-6 w-6" />
                    Prenota una Visita
                </button>
            </div>
        </section>
    )
}
