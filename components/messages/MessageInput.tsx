'use client'

import { Paperclip, Send, Smile, X } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/hooks/useTheme'

// Lazy-load emoji-mart: ~350KB caricati solo al primo click su Smile
const EmojiPicker = dynamic(
    () => import('@emoji-mart/react').then(m => m.default ?? m),
    { ssr: false, loading: () => null }
)

export interface ReplyingTo {
    senderName: string
    text: string | null
}

interface Props {
    onSend: (text: string) => Promise<void>
    onTyping?: () => void
    disabled?: boolean
    placeholder?: string
    replyingTo?: ReplyingTo | null
    onCancelReply?: () => void
    /** Pre-fills textarea when entering edit mode */
    editText?: string | null
    onCancelEdit?: () => void
}

export default function MessageInput({ onSend, onTyping, disabled = false, placeholder = 'Scrivi un messaggio...', replyingTo, onCancelReply, editText, onCancelEdit }: Props) {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    // Preload data dopo il primo render cosÃ¬ il picker si apre istantaneamente
    const [emojiData, setEmojiData] = useState<any>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const cursorPosRef = useRef<number>(0)
    const cursorPosRef2 = useRef<number>(0)
    const { theme } = useTheme()

    // Preload emoji data in background (non blocca il render)
    useEffect(() => {
        import('@emoji-mart/data').then(m => setEmojiData(m.default ?? m))
    }, [])

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        }
    }, [text])

    // Seed text when edit mode activates
    useEffect(() => {
        if (editText != null) {
            setText(editText)
            // Move cursor to end
            setTimeout(() => {
                const ta = textareaRef.current
                if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }
            }, 0)
        } else {
            // Exiting edit mode — clear text only if it was an edit
        }
    }, [editText])

    // Focus textarea when replying changes
    useEffect(() => {
        if (replyingTo) textareaRef.current?.focus()
    }, [replyingTo])

    // Chiudi emoji picker click fuori
    useEffect(() => {
        if (!showEmojiPicker) return
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showEmojiPicker])

    // Salva posizione cursore prima che la textarea perda il focus
    const saveCursor = useCallback(() => {
        if (textareaRef.current) {
            cursorPosRef.current = textareaRef.current.selectionStart
        }
    }, [])

    const onEmojiSelect = useCallback((emoji: { native: string }) => {
        const pos = cursorPosRef.current
        const native = emoji.native
        setText(prev => prev.substring(0, pos) + native + prev.substring(pos))
        cursorPosRef.current = pos + native.length
        // Riposiziona cursore e mantieni focus sulla textarea
        setTimeout(() => {
            const textarea = textareaRef.current
            if (textarea) {
                textarea.focus()
                textarea.setSelectionRange(cursorPosRef.current, cursorPosRef.current)
            }
        }, 0)
    }, [])

    const handleSend = async () => {
        const trimmed = text.trim()
        if (!trimmed || sending || disabled) return

        setSending(true)
        try {
            await onSend(trimmed)
            setText('')
            // Reset height and re-focus so user can type immediately
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } finally {
            setSending(false)
            textareaRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === 'Escape') {
            if (editText != null) { onCancelEdit?.(); setText(''); return }
            if (replyingTo) onCancelReply?.()
        }
    }

    return (
        <div className="border-t border-base-300/70 bg-base-200/55">
            {/* Edit mode banner */}
            {editText != null && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                    <div className="flex-1 border-l-2 border-warning bg-warning/5 rounded-r-lg px-3 py-1.5 min-w-0">
                        <p className="text-xs font-semibold text-warning">Modifica messaggio</p>
                    </div>
                    <button
                        onClick={() => { onCancelEdit?.(); setText('') }}
                        className="btn btn-ghost btn-xs btn-square flex-shrink-0"
                        aria-label="Annulla modifica"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Reply preview banner */}
            {replyingTo && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                    <div className="flex-1 border-l-2 border-primary bg-primary/5 rounded-r-lg px-3 py-1.5 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">{replyingTo.senderName}</p>
                        <p className="text-xs text-secondary truncate">
                            {replyingTo.text == null ? 'Messaggio eliminato' : replyingTo.text}
                        </p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="btn btn-ghost btn-xs btn-square flex-shrink-0"
                        aria-label="Annulla risposta"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-3 p-4">
                {/* Icone azioni */}
                <div className="flex items-center gap-1 pb-2 relative" ref={emojiPickerRef}>
                    {/* emoji-mart Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                            <EmojiPicker
                                data={emojiData}
                                onEmojiSelect={onEmojiSelect}
                                locale="it"
                                theme={theme === 'sprinta-dark' ? 'dark' : 'light'}
                                previewEmoji="soccer"
                                previewPosition="none"
                                skinTonePosition="search"
                                set="native"
                                dynamicWidth={false}
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            saveCursor()
                            setShowEmojiPicker(prev => !prev)
                        }}
                        className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-primary bg-primary/15' : 'text-secondary hover:text-base-content hover:bg-base-300/60'}`}
                        title="Emoji"
                        aria-label="Apri selettore emoji"
                        disabled={disabled}
                    >
                        <Smile size={20} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-secondary hover:text-base-content hover:bg-base-300/60 rounded-full transition-colors"
                        title="Allegato (coming soon)"
                        aria-label="Allegato non disponibile"
                        disabled
                    >
                        <Paperclip size={20} />
                    </button>
                </div>

                {/* Textarea */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => { setText(e.target.value); onTyping?.() }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || sending}
                        rows={1}
                        className="w-full resize-none border border-base-300 rounded-2xl px-4 py-3 text-[15px] text-secondary placeholder:text-secondary/50 bg-base-300/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors disabled:bg-base-300/30 disabled:text-secondary/50"
                        style={{ minHeight: '48px', maxHeight: '150px' }}
                    />
                </div>

                {/* Bottone Invia */}
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending || disabled}
                    className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full hover:bg-brand-700 disabled:bg-base-300 disabled:text-secondary/50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="Invia messaggio"
                    aria-label="Invia messaggio"
                >
                    <Send size={20} className={sending ? 'animate-pulse' : ''} />
                </button>
            </div>

            {/* Hint */}
            <p className="text-[11px] glass-quiet-text mt-1 mb-3 text-center">
                Premi <kbd className="px-1 py-0.5 bg-base-300/80 rounded text-secondary">Invio</kbd> per inviare, <kbd className="px-1 py-0.5 bg-base-300/80 rounded text-secondary">Shift+Invio</kbd> per nuova riga
            </p>
        </div>
    )
}

