'use client'
import { useState } from 'react'
import ProfileTabs from './profile-tabs'
const InformazioniTab = ({ user, seasons }: { user: any, seasons?: any[] }) => {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Informazioni</h2>

            {user ? (
                <div className="text-sm text-gray-700 space-y-1">
                    {user.name && <p className="font-medium">{user.name}</p>}
                    {user.email && <p className="text-sm">{user.email}</p>}
                    {user.bio && <p className="text-sm">{user.bio}</p>}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Nessuna informazione disponibile.</p>
            )}

            {seasons && seasons.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium mt-3">Stagioni</h3>
                    <ul className="list-disc pl-5 text-sm">
                        {seasons.map((s: any, i: number) => (
                            <li key={i}>{s.name ?? String(s)}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

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
