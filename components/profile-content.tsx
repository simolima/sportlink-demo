'use client'
import { useState } from 'react'
import ProfileTabs from './profile-tabs'
import InformazioniTab from './informazioni-tab'

type TabType = 'informazioni'

interface ProfileContentProps {
    user: any
    seasons?: any[]
}

export default function ProfileContent({ user, seasons }: ProfileContentProps) {
    const [activeTab, setActiveTab] = useState<TabType>('informazioni')

    return (
        <div className="space-y-0">
            {/* Tabs Navigation */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="py-6">
                {activeTab === 'informazioni' && (
                    <InformazioniTab user={user} seasons={seasons} />
                )}
            </div>
        </div>
    )
}
