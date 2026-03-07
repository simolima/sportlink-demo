'use client'

import { Paperclip, Send, Smile } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load emoji-mart: ~350KB caricati solo al primo click su Smile
const EmojiPicker = dynamic(
    () => import('@emoji-mart/react').then(m => m.default ?? m),
    { ssr: false, loading: () => null }
)

interface Props {
    onSend: (text: string) => Promise<void>
    disabled?: boolean
    placeholder?: string
}

export default function MessageInput({ onSend, disabled = false, placeholder = 'Scrivi un messaggio...' }: Props) {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    // Preload data dopo il primo render così il picker si apre istantaneamente
    const [emojiData, setEmojiData] = useState<any>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const cursorPosRef = useRef<number>(0)

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
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-end gap-3">
                {/* Icone azioni */}
                <div className="flex items-center gap-1 pb-2 relative" ref={emojiPickerRef}>
                    {/* emoji-mart Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                            <EmojiPicker
                                data={emojiData}
                                onEmojiSelect={onEmojiSelect}
                                locale="it"
                                theme="light"
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
                        className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-[#2341F0] bg-[#EEF1F7]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title="Emoji"
                        disabled={disabled}
                    >
                        <Smile size={20} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Allegato (coming soon)"
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
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || sending}
                        rows={1}
                        className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#2341F0] focus:ring-2 focus:ring-[#2341F0]/20 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ minHeight: '48px', maxHeight: '150px' }}
                    />
                </div>

                {/* Bottone Invia */}
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending || disabled}
                    className="flex items-center justify-center w-12 h-12 bg-[#2341F0] text-white rounded-full hover:bg-[#3B52F5] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="Invia messaggio"
                >
                    <Send size={20} className={sending ? 'animate-pulse' : ''} />
                </button>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-gray-400 mt-2 text-center">
                Premi <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500">Invio</kbd> per inviare, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500">Shift+Invio</kbd> per nuova riga
            </p>
        </div>
    )
}
