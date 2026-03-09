'use client'

import { useState } from 'react'
import { SmilePlus, Pencil, MessageSquare, MoreHorizontal } from 'lucide-react'
import { REACTION_ICONS, REACTION_LABELS } from './reactionIcons'
import { ReactionType } from '@/lib/types'
import clsx from 'clsx'

// First 4 reactions shown as quick-pick shortcuts
const QUICK_REACTIONS: ReactionType[] = ['like', 'love', 'fire', 'trophy']

interface Props {
    isMine: boolean
    canEdit: boolean
    canReply: boolean
    onReact: (type: ReactionType) => void
    onEdit: () => void
    onReply: () => void
    /** Receives the button DOM element so the caller can position the context menu */
    onMoreOptions: (anchor: HTMLElement) => void
}

export default function MessageHoverToolbar({
    isMine, canEdit, canReply, onReact, onEdit, onReply, onMoreOptions,
}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false)

    return (
        <div
            className={clsx(
                'absolute -top-10 z-20 hidden group-hover:flex items-center gap-0.5',
                'bg-base-100 border border-base-300 rounded-full shadow-lg px-2 py-1',
                isMine ? 'right-0' : 'left-0'
            )}
        >
            {/* 4 quick-reaction shortcuts */}
            {QUICK_REACTIONS.map(type => {
                const Icon = REACTION_ICONS[type]
                return (
                    <button
                        key={type}
                        onClick={() => onReact(type)}
                        className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                        title={REACTION_LABELS[type]}
                        aria-label={REACTION_LABELS[type]}
                    >
                        <Icon size={15} />
                    </button>
                )
            })}

            {/* SmilePlus → full picker with all 6 reactions */}
            <div className="relative">
                <button
                    onClick={() => setPickerOpen(v => !v)}
                    className={clsx(
                        'btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary',
                        pickerOpen && 'text-primary bg-primary/10'
                    )}
                    title="Tutte le reazioni"
                    aria-label="Tutte le reazioni"
                >
                    <SmilePlus size={15} />
                </button>
                {pickerOpen && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-base-100 border border-base-300 rounded-full shadow-xl px-2 py-1 z-30">
                        {(Object.keys(REACTION_ICONS) as ReactionType[]).map(type => {
                            const Icon = REACTION_ICONS[type]
                            return (
                                <button
                                    key={type}
                                    onClick={() => { onReact(type); setPickerOpen(false) }}
                                    className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                                    title={REACTION_LABELS[type]}
                                    aria-label={REACTION_LABELS[type]}
                                >
                                    <Icon size={15} />
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Pencil — only when the message is editable */}
            {canEdit && (
                <button
                    onClick={onEdit}
                    className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                    title="Modifica"
                    aria-label="Modifica"
                >
                    <Pencil size={14} />
                </button>
            )}

            {/* Vertical separator */}
            <span className="w-px h-4 bg-base-300 mx-0.5 flex-shrink-0" aria-hidden />

            {/* Reply / quote */}
            {canReply && (
                <button
                    onClick={onReply}
                    className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                    title="Rispondi con citazione"
                    aria-label="Rispondi con citazione"
                >
                    <MessageSquare size={14} />
                </button>
            )}

            {/* More options (⋯) */}
            <button
                onClick={e => onMoreOptions(e.currentTarget)}
                className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                title="Altre opzioni"
                aria-label="Altre opzioni"
            >
                <MoreHorizontal size={15} />
            </button>
        </div>
    )
}
