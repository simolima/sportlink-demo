'use client'

import { useEffect, useRef, useState } from 'react'
import { Trash2, EyeOff, Forward, Copy, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export interface MessageAction {
    canDeleteForAll: boolean
    canForward: boolean
}

interface Props {
    x: number
    y: number
    isMine: boolean
    actions: MessageAction
    onClose: () => void
    onForwardSingle: () => void
    onForwardMulti: () => void
    onDeleteForAll: () => void
    onDeleteForMe: () => void
    onCopy: () => void
}

export default function MessageContextMenu({
    x, y, isMine, actions, onClose,
    onForwardSingle, onForwardMulti, onDeleteForAll, onDeleteForMe, onCopy,
}: Props) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [forwardExpanded, setForwardExpanded] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number; transformOrigin: string }>({ top: y, left: x, transformOrigin: 'top center' })

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
        }
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleEsc)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleEsc)
        }
    }, [onClose])

    // Dynamically position menu: above/below based on space, left/right based on isMine
    useEffect(() => {
        if (!menuRef.current) return
        const rect = menuRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const menuHeight = rect.height
        
        // Decide if menu should go above or below the anchor
        const spaceBelow = viewportHeight - y
        const positionAbove = spaceBelow < menuHeight + 20
        
        let finalTop = positionAbove ? y - menuHeight - 8 : y + 8
        let finalLeft = x
        let transformOrigin = positionAbove ? 'bottom center' : 'top center'
        
        // Adjust left/right based on isMine and viewport width
        if (isMine) {
            // Own message (right side): menu appears to the left of anchor
            finalLeft = x - rect.width - 8
            if (finalLeft < 8) finalLeft = x + 8  // fallback right if no space left
            transformOrigin = positionAbove ? 'bottom right' : 'top right'
        } else {
            // Other message (left side): menu appears to the right of anchor
            finalLeft = x + 8
            if (finalLeft + rect.width > viewportWidth - 8) finalLeft = x - rect.width - 8  // fallback left if no space right
            transformOrigin = positionAbove ? 'bottom left' : 'top left'
        }
        
        // Clamp to viewport
        finalLeft = Math.max(8, Math.min(finalLeft, viewportWidth - rect.width - 8))
        finalTop = Math.max(8, Math.min(finalTop, viewportHeight - menuHeight - 8))
        
        setPosition({ top: finalTop, left: finalLeft, transformOrigin })
    }, [x, y, isMine])

    const style: React.CSSProperties = { position: 'fixed', top: position.top, left: position.left, zIndex: 9999, transformOrigin: position.transformOrigin }

    return (
        <div
            ref={menuRef}
            style={style}
            className="bg-base-100 border border-base-300 rounded-xl shadow-xl p-1.5 min-w-[190px]"
        >
            {/* Forward with expandable submenu */}
            {actions.canForward && (
                <>
                    <button
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors text-base-content hover:bg-base-200"
                        onClick={() => setForwardExpanded(v => !v)}
                    >
                        <Forward size={15} />
                        <span className="flex-1">Inoltra</span>
                        <ChevronRight
                            size={14}
                            className={clsx('text-secondary transition-transform duration-150', forwardExpanded && 'rotate-90')}
                        />
                    </button>
                    {forwardExpanded && (
                        <div className="ml-4 border-l border-base-300 pl-2 pb-1 space-y-0.5">
                            <button
                                className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content"
                                onClick={() => { onForwardSingle(); onClose() }}
                            >
                                Questo messaggio
                            </button>
                            <button
                                className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content"
                                onClick={() => { onForwardMulti(); onClose() }}
                            >
                                Più messaggi…
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Copy */}
            <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors text-base-content hover:bg-base-200"
                onClick={() => { onCopy(); onClose() }}
            >
                <Copy size={15} />
                <span>Copia testo</span>
            </button>

            <div className="my-1 border-t border-base-300" />

            {/* Delete for all (only own messages) */}
            {actions.canDeleteForAll && (
                <button
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors text-error hover:bg-error/10"
                    onClick={() => { onDeleteForAll(); onClose() }}
                >
                    <Trash2 size={15} />
                    <span>Elimina per tutti</span>
                </button>
            )}

            {/* Delete for me */}
            <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors text-error hover:bg-error/10"
                onClick={() => { onDeleteForMe(); onClose() }}
            >
                <EyeOff size={15} />
                <span>Elimina per me</span>
            </button>
        </div>
    )
}


