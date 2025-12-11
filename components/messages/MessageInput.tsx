'use client'

import { Paperclip, Send, Smile } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface Props {
    onSend: (text: string) => Promise<void>
    disabled?: boolean
    placeholder?: string
}

/**
 * MessageInput - Input messaggi moderno stile LinkedIn
 * 
 * - Textarea auto-resize
 * - Enter per inviare, Shift+Enter per nuova riga
 * - Bottone Invia blu Sprinta
 * - Icone emoji e allegato (placeholder per future features)
 */
export default function MessageInput({ onSend, disabled = false, placeholder = 'Scrivi un messaggio...' }: Props) {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        }
    }, [text])

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
                {/* Icone azioni (placeholder) */}
                <div className="flex items-center gap-1 pb-2">
                    <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Emoji (coming soon)"
                        disabled
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
