"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Page() {
  const router = useRouter()

  const handleAccedi = () => {
    router.push('/login')
  }

  const handleCreaProfilo = () => {
    router.push('/signup')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-8"
      style={{ backgroundColor: '#0A0F32' }}
    >
      <div className="w-full max-w-3xl text-center -mt-32">
        {/* Logo Sprinta */}
        <div className="mb-0 flex justify-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96">
            <Image
              src="/logo.svg"
              alt="Sprinta Logo"
              fill
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Titolo principale */}
        <h1 className="mb-6 leading-tight -mt-32">
          <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            SPRINTA
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2">
            IL TUO FUTURO
          </div>
        </h1>

        {/* Sottotitolo */}
        <p className="text-base md:text-lg text-blue-200/90 mb-10 max-w-xl mx-auto font-light">
          Accedi o crea il tuo profilo professionale nel mondo dello sport.
        </p>

        {/* Pulsanti CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          {/* Pulsante ACCEDI (Primario) */}
          <button
            onClick={handleAccedi}
            className="w-full sm:w-auto px-12 py-4 text-lg font-semibold text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: '#2341F0',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3B52F5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2341F0'}
          >
            ACCEDI
          </button>

          {/* Pulsante CREA PROFILO (Secondario) */}
          <button
            onClick={handleCreaProfilo}
            className="w-full sm:w-auto px-12 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#2341F0',
              color: '#2341F0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2341F0'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#2341F0'
            }}
          >
            CREA PROFILO
          </button>
        </div>
      </div>
    </div>
  )
}
