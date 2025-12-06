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
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-sprinta-navy rounded-2xl shadow-2xl p-8">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">Accedi</h2>
                    <p className="text-center text-white/80 mb-6">Inserisci la tua email per continuare</p>
                    <LoginCard />
                </div>
            </div>
        </div>
    )
}
