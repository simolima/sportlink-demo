'use client'

import { Users, Settings, ChevronLeft } from 'lucide-react'

interface Props {
    groupId: string
    groupName: string
    memberCount: number
    isAdmin: boolean
    onBack?: () => void
    showBackButton?: boolean
    onManage: () => void
}

export default function GroupChatHeader({
    groupId,
    groupName,
    memberCount,
    isAdmin,
    onBack,
    showBackButton = false,
    onManage,
}: Props) {
    const initials = groupName
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <div className="glass-widget-header flex items-center gap-3 px-4 py-3 border-b border-base-300/50 flex-shrink-0">
            {showBackButton && (
                <button
                    onClick={onBack}
                    className="btn btn-ghost btn-sm btn-square mr-1"
                    aria-label="Torna alla lista"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Group avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {initials || <Users size={18} />}
            </div>

            {/* Group info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base-content truncate text-sm">{groupName}</h3>
                <p className="text-xs text-secondary">
                    {memberCount} {memberCount === 1 ? 'membro' : 'membri'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onManage}
                    className="btn btn-ghost btn-sm btn-square"
                    aria-label="Gestisci gruppo"
                    title="Dettagli gruppo"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
    )
}
