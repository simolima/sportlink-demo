'use client'
import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SocialLink {
    instagram?: string
    tiktok?: string
    youtube?: string
    facebook?: string
    twitter?: string
    linkedin?: string
    transfermarkt?: string
}

interface SocialLinksFormProps {
    socialLinks?: SocialLink
    onChange: (socialLinks: SocialLink) => void
    inputClassName?: string
    showTransfermarkt?: boolean
}

const SOCIAL_PLATFORMS = [
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/channel/...' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
    { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
] as const

const TRANSFERMARKT_PLATFORM = {
    key: 'transfermarkt',
    label: 'Transfermarkt',
    placeholder: 'https://www.transfermarkt.it/profilo/spielerdetails/...'
} as const

export default function SocialLinksForm({
    socialLinks = {},
    onChange,
    inputClassName = 'w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2341F0] focus:ring-2 focus:ring-[#2341F0] focus:ring-opacity-40',
    showTransfermarkt = false
}: SocialLinksFormProps) {
    const platforms = showTransfermarkt
        ? [...SOCIAL_PLATFORMS, TRANSFERMARKT_PLATFORM]
        : SOCIAL_PLATFORMS
    const handleChange = (platform: keyof SocialLink, value: string) => {
        const updated = { ...socialLinks }
        if (value.trim()) {
            updated[platform] = value
        } else {
            delete updated[platform]
        }
        onChange(updated)
    }

    const handleClear = (platform: keyof SocialLink) => {
        const updated = { ...socialLinks }
        delete updated[platform]
        onChange(updated)
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Link Social Media</h3>
                <p className="text-sm text-gray-600">
                    Aggiungi i tuoi profili social (opzionale). Saranno visibili nel tuo profilo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map(({ key, label, placeholder }) => (
                    <div key={key} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {label}
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                placeholder={placeholder}
                                value={socialLinks[key as keyof SocialLink] || ''}
                                onChange={(e) => handleChange(key as keyof SocialLink, e.target.value)}
                                className={inputClassName}
                            />
                            {socialLinks[key as keyof SocialLink] && (
                                <button
                                    type="button"
                                    onClick={() => handleClear(key as keyof SocialLink)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    title="Cancella"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    💡 <strong>Suggerimento:</strong> Utilizza gli URL completi dei tuoi profili social.
                    Gli utenti potranno cliccare sui link per visitarli.
                </p>
            </div>
        </div>
    )
}
