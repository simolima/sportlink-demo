'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { MessageReaction, ReactionType } from '@/lib/types'
import { REACTION_ICONS, REACTION_LABELS } from './reactionIcons'

interface Props {
    reactions: MessageReaction[]
    onClose: () => void
}

export default function ReactionsPopover({ reactions, onClose }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('mousedown', h)
        document.addEventListener('keydown', esc)
        return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', esc) }
    }, [onClose])

    return (
        <div
            ref={ref}
            className="absolute bottom-full mb-2 left-0 z-50 bg-base-100 border border-base-300 rounded-xl shadow-xl p-3 min-w-[240px]"
            role="dialog"
            aria-modal="true"
            aria-label="Chi ha reagito"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-base-content">Reazioni</span>
                <button onClick={onClose} className="btn btn-ghost btn-xs btn-square">
                    <X size={14} />
                </button>
            </div>

            <div className="space-y-2">
                {reactions.map(r => {
                    const Icon = REACTION_ICONS[r.type as ReactionType]
                    const label = REACTION_LABELS[r.type as ReactionType]
                    return (
                        <div key={r.type}>
                            <div className="flex items-center gap-1.5 mb-1">
                                {Icon && <Icon size={14} className="text-primary" />}
                                <span className="text-xs font-medium text-base-content">{label}</span>
                                <span className="text-xs text-secondary ml-auto">{r.count}</span>
                            </div>
                            <ul className="pl-5 space-y-0.5">
                                {r.users.map(u => (
                                    <li key={u.userId} className="text-xs text-secondary">{u.name}</li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
