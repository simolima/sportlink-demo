'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import {
    NOTIFICATION_CATEGORIES,
    CATEGORY_TRANSLATIONS,
    CATEGORY_DESCRIPTIONS,
    NotificationCategory,
    DEFAULT_NOTIFICATION_PREFERENCES
} from '@/lib/notification-utils'

export default function NotificationSettingsPage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useRequireAuth(false)
    const [preferences, setPreferences] = useState<Record<NotificationCategory, boolean>>(
        DEFAULT_NOTIFICATION_PREFERENCES
    )
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const userId = user?.id ? String(user.id) : null

    useEffect(() => {
        if (userId) {
            fetchPreferences(userId)
        }
    }, [userId])

    const fetchPreferences = async (userId: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/notification-preferences?userId=${userId}`)
            if (res.ok) {
                const data = await res.json()
                setPreferences(data.preferences)
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error)
        } finally {
            setLoading(false)
        }
    }

    const savePreferences = async () => {
        if (!userId) return

        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch('/api/notification-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, preferences }),
            })

            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (error) {
            console.error('Failed to save preferences:', error)
        } finally {
            setSaving(false)
        }
    }

    const toggleCategory = (category: NotificationCategory) => {
        setPreferences(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const enableAll = () => {
        const allEnabled = Object.keys(NOTIFICATION_CATEGORIES).reduce(
            (acc, cat) => ({ ...acc, [cat]: true }),
            {} as Record<NotificationCategory, boolean>
        )
        setPreferences(allEnabled)
    }

    const disableAll = () => {
        const allDisabled = Object.keys(NOTIFICATION_CATEGORIES).reduce(
            (acc, cat) => ({ ...acc, [cat]: false }),
            {} as Record<NotificationCategory, boolean>
        )
        setPreferences(allDisabled)
    }

    // Icone per ogni categoria
    const getCategoryIcon = (category: NotificationCategory) => {
        const icons: Record<NotificationCategory, string> = {
            follower: '👥',
            messages: '💬',
            applications: '📋',
            affiliations: '🤝',
            club: '🏟️',
            opportunities: '💼',
            permissions: '🔐'
        }
        return icons[category]
    }

    if (authLoading || loading) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                    <p>Caricamento...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/notifications"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <Bell size={28} />
                    <div>
                        <h1 className="text-2xl font-bold">Impostazioni Notifiche</h1>
                        <p className="text-sm text-gray-500">Scegli quali notifiche ricevere</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={enableAll}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                    Abilita tutte
                </button>
                <button
                    onClick={disableAll}
                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                    Disabilita tutte
                </button>
            </div>

            {/* Categories */}
            <div className="space-y-3 mb-8">
                {(Object.keys(NOTIFICATION_CATEGORIES) as NotificationCategory[]).map((category) => (
                    <div
                        key={category}
                        className={`border rounded-lg p-4 transition-all ${preferences[category] ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getCategoryIcon(category)}</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {CATEGORY_TRANSLATIONS[category]}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {CATEGORY_DESCRIPTIONS[category]}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${preferences[category] ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences[category] ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Se disabiliti una categoria, non riceverai più notifiche di quel tipo.
                    Le notifiche già ricevute rimarranno visibili nella tua lista.
                </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Salvataggio...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salva preferenze
                        </>
                    )}
                </button>

                {saved && (
                    <span className="text-green-600 font-medium animate-in fade-in duration-300">
                        ✓ Preferenze salvate
                    </span>
                )}
            </div>
        </div>
    )
}
