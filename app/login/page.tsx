"use client"
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginCard from '@/components/login-card'

export default function LoginLanding() {
    const router = useRouter()

    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Accedi</h2>
                    <p className="text-center text-gray-600 mb-6">Inserisci la tua email per continuare</p>
                    <LoginCard />
                </div>
            </div>
        </div>
    )
}
