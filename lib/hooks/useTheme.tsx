'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ThemeMode = 'sprinta-light' | 'sprinta-dark'

interface ThemeContextType {
    theme: ThemeMode
    isReady: boolean
    setTheme: (theme: ThemeMode) => void
    toggleTheme: () => void
}

const STORAGE_KEY = 'sprinta-theme'
const DEFAULT_THEME: ThemeMode = 'sprinta-light'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyThemeToDom(theme: ThemeMode) {
    document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const initialTheme: ThemeMode = stored === 'sprinta-dark' || stored === 'sprinta-light'
                ? stored
                : (systemPrefersDark ? 'sprinta-dark' : 'sprinta-light')

            setThemeState(initialTheme)
            applyThemeToDom(initialTheme)
        } catch {
            setThemeState(DEFAULT_THEME)
            applyThemeToDom(DEFAULT_THEME)
        } finally {
            setIsReady(true)
        }
    }, [])

    const setTheme = useCallback((nextTheme: ThemeMode) => {
        setThemeState(nextTheme)
        applyThemeToDom(nextTheme)
        localStorage.setItem(STORAGE_KEY, nextTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'sprinta-dark' ? 'sprinta-light' : 'sprinta-dark')
    }, [theme, setTheme])

    const value = useMemo(() => ({
        theme,
        isReady,
        setTheme,
        toggleTheme,
    }), [theme, isReady, setTheme, toggleTheme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider')
    }
    return context
}
