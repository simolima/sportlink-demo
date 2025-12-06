"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  // Nascondo la navbar sulla landing per mostrare solo l'immagine
  useEffect(() => {
    const header = document.querySelector('header')
    if (header) header.classList.add('hidden')
    return () => { if (header) header.classList.remove('hidden') }
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center">
      <div className="max-w-7xl w-full mx-auto px-6 md:px-10 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Colonna sinistra: titolo, sottotitolo, CTA */}
        <section className="order-2 md:order-1">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Il tuo ecosistema professionale per lo sport.
          </h1>
          <p className="mt-4 text-base md:text-xl text-gray-600 max-w-2xl">
            Un unico spazio per connettersi con atleti, staff tecnici, agenti, preparatori, club, federazioni e specialisti.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/login')}
              className="px-7 md:px-8 py-3 md:py-3.5 rounded-xl bg-green-600 text-white text-base md:text-lg font-semibold shadow-lg hover:bg-green-700 transition"
            >
              Accedi
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-7 md:px-8 py-3 md:py-3.5 rounded-xl border-2 border-green-600 text-green-600 text-base md:text-lg font-semibold hover:bg-green-600 hover:text-white transition"
            >
              Crea un profilo
            </button>
          </div>
        </section>

        {/* Colonna destra: logo vettoriale */}
        <aside className="order-1 md:order-2 flex justify-center md:justify-end">
          <div className="relative isolate w-full max-w-md md:max-w-lg">
            {/* Glow verde dietro al logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] rounded-full bg-green-300/20 blur-3xl z-0 pointer-events-none"></div>

            {/* Logo sopra il glow */}
            <img
              src="/logo.svg"
              alt="SPRINTA logo"
              className="relative z-10 w-full h-auto object-contain select-none drop-shadow-2xl"
              draggable={false}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
