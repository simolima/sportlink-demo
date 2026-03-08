'use client'

/**
 * AuthLoadingGate — Splash screen branded durante l'hydration iniziale.
 *
 * Avvolge {children} e mostra un fullscreen splash Sprinta finché
 * useAuth().isLoading è true (~50ms al primo caricamento da localStorage).
 *
 * Decisione UX: il gate è separato da AuthProvider (rispetta SRP).
 * Logo bianco monocromatico — standard brand professionale su sfondo scuro.
 */

import { useAuth } from '@/lib/hooks/useAuth'
import SprintaLoader from '@/components/ui/SprintaLoader'

interface Props {
    children: React.ReactNode
}

export default function AuthLoadingGate({ children }: Props) {
    const { isLoading } = useAuth()

    if (!isLoading) return <>{children}</>

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
            style={{
                background: `
                    radial-gradient(1100px 560px at 8% -14%, rgba(72, 98, 255, 0.14), transparent 60%),
                    radial-gradient(980px 520px at 94% -6%, rgba(130, 104, 255, 0.10), transparent 62%),
                    linear-gradient(180deg, #0d112c 0%, #0b1027 58%, #090d22 100%)
                `,
            }}
        >
            <SprintaLoader size="lg" color="white" />

            <div className="flex flex-col items-center gap-1">
                <span
                    className="text-white font-bold tracking-[0.22em] uppercase"
                    style={{ fontSize: '1.125rem' }}
                >
                    SPRINTA
                </span>
                <span className="text-secondary/70 text-xs tracking-wide">
                    Sport Network
                </span>
            </div>
        </div>
    )
}
