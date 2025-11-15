"use client"
import React, { useEffect } from 'react'
import LoginCard from '@/components/login-card'

export default function LoginEnter() {
    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-md p-6">
                <LoginCard />
            </div>
        </div>
    )
}
