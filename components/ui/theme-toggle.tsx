'use client'

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/lib/hooks/useTheme'

export default function ThemeToggle() {
    const { theme, isReady, toggleTheme } = useTheme()
    const isDark = theme === 'sprinta-dark'

    return (
        <button
            type="button"
            onClick={toggleTheme}
            disabled={!isReady}
            aria-label={isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
            className="btn btn-ghost btn-sm border border-base-300/80 text-base-content hover:bg-base-200"
            title={isDark ? 'Tema chiaro' : 'Tema scuro'}
        >
            {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
    )
}
