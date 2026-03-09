'use client'

import { useEffect, useRef, useState } from 'react'
import { SmilePlus, Pencil, MessageSquare, MoreHorizontal } from 'lucide-react'
import { REACTION_LABELS } from './reactionIcons'
import { ReactionType } from '@/lib/types'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/hooks/useTheme'

const EmojiPicker = dynamic(
    () => import('@emoji-mart/react').then(m => m.default ?? m),
    { ssr: false, loading: () => null }
)

const QUICK_REACTIONS: Array<{ emoji: string; label: string }> = [
    { emoji: '👍', label: 'Mi piace' },
    { emoji: '❤️', label: 'Adoro' },
    { emoji: '🔥', label: 'Fuoco' },
    { emoji: '🏆', label: 'Trofeo' },
]

// Approximate emoji-mart picker dimensions
const PICKER_W = 360
const PICKER_H = 440

interface Props {
    isMine: boolean
    canEdit: boolean
    canReply: boolean
    /** Controlled visibility: true when parent detects hover */
    visible: boolean
    onReact: (type: ReactionType) => void
    onEdit: () => void
    onReply: () => void
    onMoreOptions: (anchor: HTMLElement) => void
}

export default function MessageHoverToolbar({
    isMine, canEdit, canReply, visible, onReact, onEdit, onReply, onMoreOptions,
}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const [emojiData, setEmojiData] = useState<any>(null)
    const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({})
    const smileButtonRef = useRef<HTMLButtonElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()

    useEffect(() => {
        import('@emoji-mart/data').then(m => setEmojiData(m.default ?? m))
    }, [])

    // Compute viewport-aware fixed position for the picker
    const openPicker = () => {
        if (!smileButtonRef.current) { setPickerOpen(true); return }
        const btnRect = smileButtonRef.current.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        // Vertical: open above the button if there's enough room, else below
        const spaceAbove = btnRect.top
        const spaceBelow = vh - btnRect.bottom
        let top: number
        if (spaceAbove >= PICKER_H + 8) {
            top = btnRect.top - PICKER_H - 8
        } else if (spaceBelow >= PICKER_H + 8) {
            top = btnRect.bottom + 8
        } else {
            // Best fit: wherever there's more space
            top = spaceAbove > spaceBelow
                ? Math.max(8, btnRect.top - PICKER_H - 8)
                : btnRect.bottom + 8
        }

        // Horizontal: anchor to button, clamped to viewport
        let left = isMine ? btnRect.right - PICKER_W : btnRect.left
        left = Math.max(8, Math.min(left, vw - PICKER_W - 8))
        top = Math.max(8, Math.min(top, vh - PICKER_H - 8))

        setPickerStyle({ position: 'fixed', top, left, zIndex: 9999, width: PICKER_W })
        setPickerOpen(true)
    }

    // Close picker on outside click
    useEffect(() => {
        if (!pickerOpen) return
        const handleOutside = (e: MouseEvent) => {
            if (
                pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
                smileButtonRef.current && !smileButtonRef.current.contains(e.target as Node)
            ) {
                setPickerOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [pickerOpen])

    const isVisible = visible || pickerOpen

    return (
        <>
            <div
                className={clsx(
                    'absolute -top-10 z-20 flex items-center gap-0.5 transition-opacity duration-100',
                    'bg-base-100 border border-base-300 rounded-full shadow-lg px-2 py-1',
                    isMine ? 'right-0' : 'left-0',
                    isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
            >
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

                <button
                    ref={smileButtonRef}
                    onClick={pickerOpen ? () => setPickerOpen(false) : openPicker}
                    className={clsx(
                        'btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary',
                        pickerOpen && 'text-primary bg-primary/10'
                    )}
                    title="Tutte le reazioni"
                    aria-label="Tutte le reazioni"
                >
                    <SmilePlus size={15} />
                </button>

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

                <span className="w-px h-4 bg-base-300 mx-0.5 flex-shrink-0" aria-hidden />

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

                <button
                    onClick={e => onMoreOptions(e.currentTarget)}
                    className="btn btn-ghost btn-xs btn-circle text-secondary hover:text-primary"
                    title="Altre opzioni"
                    aria-label="Altre opzioni"
                >
                    <MoreHorizontal size={15} />
                </button>
            </div>

            {/* Picker rendered at fixed position to escape any overflow clipping */}
            {pickerOpen && (
                <div
                    ref={pickerRef}
                    style={pickerStyle}
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
        </>
    )
}

