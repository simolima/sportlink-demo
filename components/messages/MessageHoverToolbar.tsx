'use client'

import { useEffect, useRef, useState } from 'react'
import { SmilePlus, Pencil, MessageSquare, MoreHorizontal } from 'lucide-react'
import { REACTION_ICONS, REACTION_LABELS } from './reactionIcons'
import { ReactionType } from '@/lib/types'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/hooks/useTheme'

// Lazy-load emoji-mart: same pattern as MessageInput
const EmojiPicker = dynamic(
    () => import('@emoji-mart/react').then(m => m.default ?? m),
    { ssr: false, loading: () => null }
)

// Quick-pick shortcuts now use real emoji chars
const QUICK_REACTIONS: Array<{ emoji: string; label: string }> = [
    { emoji: '👍', label: 'Mi piace' },
    { emoji: '❤️', label: 'Adoro' },
    { emoji: '🔥', label: 'Fuoco' },
    { emoji: '🏆', label: 'Trofeo' },
]

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
    const [emojiData, setEmojiData] = useState<any>(null)
    const pickerContainerRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()

    // Preload emoji data in background
    useEffect(() => {
        import('@emoji-mart/data').then(m => setEmojiData(m.default ?? m))
    }, [])

    // Close picker on outside click
    useEffect(() => {
        if (!pickerOpen) return
        const handleOutside = (e: MouseEvent) => {
            if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target as Node)) {
                setPickerOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [pickerOpen])

    return (
        <div
            className={clsx(
                'absolute -top-10 z-20 hidden group-hover:flex items-center gap-0.5',
                'bg-base-100 border border-base-300 rounded-full shadow-lg px-2 py-1',
                isMine ? 'right-0' : 'left-0'
            )}
        >
            {/* 4 quick-reaction shortcuts as emoji chars */}
            {QUICK_REACTIONS.map(({ emoji, label }) => (
                <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="btn btn-ghost btn-xs btn-circle text-[15px] leading-none hover:scale-110 transition-transform"
                    title={label}
                    aria-label={label}
                >
                    {emoji}
                </button>
            ))}

            {/* SmilePlus → full emoji-mart picker */}
            <div className="relative" ref={pickerContainerRef}>
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
                    <div
                        className={clsx(
                            'absolute bottom-full mb-2 z-30',
                            // Position: right-align for own messages, left-align for others
                            isMine ? 'right-0' : 'left-0'
                        )}
                        // Stop mouse events from bubbling and triggering outside-click
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <EmojiPicker
                            data={emojiData}
                            theme={theme === 'sprinta-dark' ? 'dark' : 'light'}
                            locale="it"
                            onEmojiSelect={(emoji: { native: string }) => {
                                onReact(emoji.native)
                                setPickerOpen(false)
                            }}
                            previewPosition="none"
                            skinTonePosition="none"
                            perLine={8}
                            maxFrequentRows={1}
                        />
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

