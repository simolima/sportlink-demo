'use client'
import { ReactNode } from 'react'

interface ProfileSectionProps {
    title: string
    subtitle?: string
    children: ReactNode
    action?: ReactNode
}

export default function ProfileSection({ title, subtitle, children, action }: ProfileSectionProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div>{children}</div>
        </div>
    )
}
