'use client'

import { useEffect, useState } from 'react'
import {
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon,
    LinkIcon,
    BuildingOffice2Icon,
    BriefcaseIcon,
    UserCircleIcon,
    ShieldCheckIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BellIcon,
    ArrowLeftIcon,
    CheckIcon,
} from '@heroicons/react/24/outline'
import { Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { getAuthHeaders } from '@/lib/auth-fetch'
import {
    NOTIFICATION_CATEGORIES,
    CATEGORY_TRANSLATIONS,
    CATEGORY_DESCRIPTIONS,
    NotificationCategory,
    DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notification-utils'
import {
    isSoundEnabled,
    toggleSound,
    unlockAudioContext,
    playNotificationSound,
} from '@/lib/notification-sound'

// ─── Icone SVG per categoria (Heroicons, nessuna emoji) ──────────────────────
const CATEGORY_ICONS: Record<NotificationCategory, React.ReactNode> = {
    messages: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    applications: <ClipboardDocumentListIcon className="w-5 h-5" />,
    affiliations: <LinkIcon className="w-5 h-5" />,
    club: <BuildingOffice2Icon className="w-5 h-5" />,
    opportunities: <BriefcaseIcon className="w-5 h-5" />,
    profile: <UserCircleIcon className="w-5 h-5" />,
    permissions: <ShieldCheckIcon className="w-5 h-5" />,
}

// ─── Blocco impostazioni suono ────────────────────────────────────────────────
function SoundSettingsBlock() {
    const [soundOn, setSoundOn] = useState(true)

    useEffect(() => {
        setSoundOn(isSoundEnabled())
    }, [])

    const handleToggle = () => {
        unlockAudioContext()
        const next = toggleSound()
        setSoundOn(next)
    }

    const handlePreview = () => {
        unlockAudioContext()
        playNotificationSound('important')
    }

    return (
        <div className="border rounded-lg p-4 bg-white border-gray-200 mb-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        {soundOn ? (
                            <SpeakerWaveIcon className="w-5 h-5" />
                        ) : (
                            <SpeakerXMarkIcon className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Suono notifiche</h3>
                        <p className="text-sm text-gray-500">
                            Riproduci un suono al ricevimento di nuove notifiche
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePreview}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        aria-label="Anteprima suono notifica"
                    >
                        Prova
                    </button>
                    <button
                        onClick={handleToggle}
                        aria-label={soundOn ? 'Disabilita suono notifiche' : 'Abilita suono notifiche'}
                        className={`relative w-12 h-6 rounded-full transition-colors ${soundOn ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${soundOn ? 'left-7' : 'left-1'}`}
                        />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function NotificationSettingsPage() {
    const { user, isLoading: authLoading } = useRequireAuth(false)
    const [preferences, setPreferences] = useState<Record<NotificationCategory, boolean>>(
        DEFAULT_NOTIFICATION_PREFERENCES
    )
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const userId = user?.id ? String(user.id) : null

    useEffect(() => {
        if (userId) fetchPreferences(userId)
    }, [userId])

    const fetchPreferences = async (id: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/notification-preferences?userId=${id}`)
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
            const authHeaders = await getAuthHeaders()
            const res = await fetch('/api/notification-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
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
        setPreferences(prev => ({ ...prev, [category]: !prev[category] }))
    }

    const enableAll = () => {
        setPreferences(
            Object.keys(NOTIFICATION_CATEGORIES).reduce(
                (acc, cat) => ({ ...acc, [cat]: true }),
                {} as Record<NotificationCategory, boolean>
            )
        )
    }

    const disableAll = () => {
        setPreferences(
            Object.keys(NOTIFICATION_CATEGORIES).reduce(
                (acc, cat) => ({ ...acc, [cat]: false }),
                {} as Record<NotificationCategory, boolean>
            )
        )
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
                    aria-label="Torna alle notifiche"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-3">
                    <BellIcon className="w-7 h-7" />
                    <div>
                        <h1 className="text-2xl font-bold">Impostazioni Notifiche</h1>
                        <p className="text-sm text-gray-500">Scegli quali notifiche ricevere</p>
                    </div>
                </div>
            </div>

            {/* Sound settings */}
            <SoundSettingsBlock />

            {/* Section heading */}
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Categorie
            </h2>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
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
                                <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                    {CATEGORY_ICONS[category]}
                                </div>
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
                                aria-label={`${preferences[category] ? 'Disabilita' : 'Abilita'} notifiche ${CATEGORY_TRANSLATIONS[category]}`}
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
                    <span className="flex items-center gap-1 text-brand-600 font-medium animate-in fade-in duration-300">
                        <CheckIcon className="w-4 h-4" />
                        Preferenze salvate
                    </span>
                )}
            </div>
        </div>
    )
}
