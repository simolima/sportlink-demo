'use client'
import { useState } from 'react'
import ProfileTabs from './profile-tabs'
import InformazioniTab from './informazioni-tab'
import AggiornamentiTab from './aggiornamenti-tab'
import PostTab from './post-tab'

type TabType = 'informazioni' | 'aggiornamenti' | 'post'

interface ProfileContentProps {
    user: any
    stats?: any[]
    seasons?: any[]
    posts: any[]
}

export default function ProfileContent({ user, stats, seasons, posts }: ProfileContentProps) {
    const [activeTab, setActiveTab] = useState<TabType>('informazioni')

    return (
        <div className="space-y-0">
            {/* Tabs Navigation */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="py-6">
                {activeTab === 'informazioni' && (
                    <InformazioniTab user={user} stats={stats} seasons={seasons} />
                )}
                {activeTab === 'aggiornamenti' && (
                    <AggiornamentiTab userId={user.id} posts={posts} />
                )}
                {activeTab === 'post' && (
                    <PostTab userId={user.id} />
                )}
            </div>
        </div>
    )
}
