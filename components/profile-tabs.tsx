'use client'
import { useState } from 'react'

type TabType = 'informazioni' | 'aggiornamenti' | 'post'

interface ProfileTabsProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    const tabs = [
        { id: 'informazioni' as TabType, label: 'Informazioni' },
        { id: 'aggiornamenti' as TabType, label: 'Aggiornamenti' },
        { id: 'post' as TabType, label: 'Post' }
    ]

    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="flex justify-center gap-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            px-8 py-4 font-semibold text-sm transition-all relative
                            ${activeTab === tab.id 
                                ? 'text-gray-900 border-b-2 border-sprinta-blue' 
                                : 'text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sprinta-blue" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
