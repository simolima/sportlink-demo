'use client'

import { useEffect, useRef } from 'react'
import { Pencil, Trash2, EyeOff, Reply, Forward, Copy } from 'lucide-react'
import clsx from 'clsx'

export interface MessageAction {
    canEdit: boolean
    canDeleteForAll: boolean
    canReply: boolean
    canForward: boolean
}

interface Props {
    x: number
    y: number
    isMine: boolean
    actions: MessageAction
    onClose: () => void
    onReply: () => void
    onEdit: () => void
    onDeleteForAll: () => void
    onDeleteForMe: () => void
    onForward: () => void
    onCopy: () => void
}

export default function MessageContextMenu({
    x, y, isMine, actions, onClose,
    onReply, onEdit, onDeleteForAll, onDeleteForMe, onForward, onCopy,
}: Props) {
    const menuRef = useRef<HTMLDivElement>(null)

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

    // Adjust position to avoid overflow
    const style: React.CSSProperties = {
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999,
    }

    const Item = ({ icon: Icon, label, onClick, danger = false }: {
        icon: React.ElementType; label: string; onClick: () => void; danger?: boolean
    }) => (
        <button
            className={clsx(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors',
                danger
                    ? 'text-error hover:bg-error/10'
                    : 'text-base-content hover:bg-base-200'
            )}
            onClick={() => { onClick(); onClose() }}
        >
            <Icon size={15} />
            <span>{label}</span>
        </button>
    )

    return (
        <div
            ref={menuRef}
            style={style}
            className="bg-base-100 border border-base-300 rounded-xl shadow-xl p-1.5 min-w-[160px]"
        >
            {actions.canReply && (
                <Item icon={Reply} label="Rispondi" onClick={onReply} />
            )}
            <Item icon={Copy} label="Copia testo" onClick={onCopy} />
            {actions.canForward && (
                <Item icon={Forward} label="Inoltra" onClick={onForward} />
            )}
            {actions.canEdit && (
                <Item icon={Pencil} label="Modifica" onClick={onEdit} />
            )}
            <div className="my-1 border-t border-base-300" />
            {actions.canDeleteForAll && (
                <Item icon={Trash2} label="Elimina per tutti" onClick={onDeleteForAll} danger />
            )}
            <Item icon={EyeOff} label="Elimina per me" onClick={onDeleteForMe} danger />
        </div>
    )
}
