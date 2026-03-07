"use client"
import React from 'react'

interface MainLayoutProps {
    children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    // Layout semplificato - solo contenuto, nessuna sidebar
    // La navigazione è gestita dalla Navbar in header
    return (
        <main className="min-h-screen glass-page-bg">
            {children}
        </main>
    )
}
