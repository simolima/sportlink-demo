'use client'
import React from 'react'
import {
    GlobeAltIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import {
    FaInstagram,
    FaTiktok,
    FaYoutube,
    FaFacebook,
    FaTwitter,
    FaLinkedin
} from 'react-icons/fa'

interface SocialLinksProps {
    socialLinks?: {
        instagram?: string
        tiktok?: string
        youtube?: string
        facebook?: string
        twitter?: string
        linkedin?: string
        transfermarkt?: string
    }
    className?: string
    showLabels?: boolean
}

const TransfermarktIcon = ({ className = '' }: { className?: string }) => (
    <img
        src="/transfermarkt.png"
        alt="Transfermarkt"
        className={className}
    />
)

const SOCIAL_CONFIG = {
    instagram: {
        icon: FaInstagram,
        label: 'Instagram',
        color: 'text-pink-600',
        hoverColor: 'hover:text-pink-700',
        bgColor: 'bg-pink-50',
        hoverBg: 'hover:bg-pink-100'
    },
    tiktok: {
        icon: FaTiktok,
        label: 'TikTok',
        color: 'text-black',
        hoverColor: 'hover:text-gray-700',
        bgColor: 'bg-gray-100',
        hoverBg: 'hover:bg-gray-200'
    },
    youtube: {
        icon: FaYoutube,
        label: 'YouTube',
        color: 'text-red-600',
        hoverColor: 'hover:text-red-700',
        bgColor: 'bg-red-50',
        hoverBg: 'hover:bg-red-100'
    },
    facebook: {
        icon: FaFacebook,
        label: 'Facebook',
        color: 'text-blue-600',
        hoverColor: 'hover:text-blue-700',
        bgColor: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-100'
    },
    twitter: {
        icon: FaTwitter,
        label: 'Twitter/X',
        color: 'text-gray-800',
        hoverColor: 'hover:text-black',
        bgColor: 'bg-gray-100',
        hoverBg: 'hover:bg-gray-200'
    },
    linkedin: {
        icon: FaLinkedin,
        label: 'LinkedIn',
        color: 'text-blue-700',
        hoverColor: 'hover:text-blue-800',
        bgColor: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-100'
    },
    transfermarkt: {
        icon: TransfermarktIcon,
        label: 'Transfermarkt',
        color: 'text-sky-700',
        hoverColor: 'hover:text-sky-800',
        bgColor: 'bg-sky-50',
        hoverBg: 'hover:bg-sky-100'
    }
}

export default function SocialLinks({
    socialLinks,
    className = '',
    showLabels = false
}: SocialLinksProps) {
    // Filtra solo i social links presenti
    const activeSocials = Object.entries(socialLinks || {}).filter(
        ([_, url]) => url && url.trim()
    )

    if (activeSocials.length === 0) {
        return null
    }

    const containerClassName = showLabels
        ? `flex items-center flex-wrap gap-4 ${className}`
        : activeSocials.length <= 6
            ? `flex items-center justify-center gap-3 flex-nowrap w-full ${className}`
            : `flex items-center flex-wrap justify-center gap-3 w-full ${className}`

    return (
        <div className={containerClassName}>
            {activeSocials.map(([platform, url]) => {
                const config = SOCIAL_CONFIG[platform as keyof typeof SOCIAL_CONFIG]
                if (!config) return null

                const Icon = config.icon

                return (
                    <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={config.label}
                        className={showLabels
                            ? `inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${config.color} ${config.bgColor} ${config.hoverColor} ${config.hoverBg} font-medium text-sm hover:shadow-md`
                            : `inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${config.color} ${config.bgColor} ${config.hoverColor} ${config.hoverBg} hover:shadow-md`
                        }
                    >
                        <Icon className={showLabels ? "w-5 h-5" : "w-6 h-6"} />
                        {showLabels && <span>{config.label}</span>}
                    </a>
                )
            })}
        </div>
    )
}
