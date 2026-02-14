"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'

export default function Page() {
  const router = useRouter()
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleAccedi = () => {
    router.push('/login')
  }

  const handleCreaProfilo = () => {
    router.push('/signup')
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await loginWithGoogle()
    } catch (err) {
      console.error('Google login error:', err)
      setLoading(false)
    }
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
        <div className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto">
          {/* Pulsante GOOGLE (Principale) */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? 'Connessione...' : 'Continua con Google'}
          </button>

          {/* Divider */}
          <div className="relative w-full my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-300/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-blue-200/70 bg-[#0A0F32]">oppure</span>
            </div>
          </div>

          {/* Pulsanti Email */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            {/* Pulsante ACCEDI */}
            <button
              onClick={handleAccedi}
              disabled={loading}
              className="flex-1 px-8 py-3.5 text-base font-semibold text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: '#2341F0',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3B52F5')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2341F0')}
            >
              ACCEDI
            </button>

            {/* Pulsante CREA PROFILO */}
            <button
              onClick={handleCreaProfilo}
              disabled={loading}
              className="flex-1 px-8 py-3.5 text-base font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#2341F0',
                color: '#2341F0',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#2341F0'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#2341F0'
                }
              }}
            >
              CREA PROFILO
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
