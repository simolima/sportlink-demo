'use client'
import Link from 'next/link'

export default function LandingHero() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

            <div className="relative z-10 max-w-2xl text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Connettiti con atleti
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                    Trova compagni di allenamento, scopri opportunità e condividi la tua passione per lo sport.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                    <Link href="/create-profile" className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg">
                        Crea Account
                    </Link>
                    <Link href="/login" className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition border-2 border-white">
                        Accedi
                    </Link>
                </div>

                <div className="mt-12 text-blue-100 text-sm">
                    <p>Giá membro? <Link href="/login" className="underline hover:text-white transition">Accedi qui</Link></p>
                </div>
            </div>
        </div>
    )
}
