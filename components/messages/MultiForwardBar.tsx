'use client'

import { Forward } from 'lucide-react'

interface Props {
    count: number
    onCancel: () => void
    onForward: () => void
}

export default function MultiForwardBar({ count, onCancel, onForward }: Props) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/8 border-t border-primary/25">
            <button
                onClick={onCancel}
                className="btn btn-ghost btn-sm text-secondary"
            >
                Annulla
            </button>
            <span className="text-sm font-medium text-base-content">
                {count === 0
                    ? 'Seleziona messaggi'
                    : `${count} ${count === 1 ? 'messaggio selezionato' : 'messaggi selezionati'}`}
            </span>
            <button
                onClick={onForward}
                disabled={count === 0}
                className="btn btn-primary btn-sm gap-1.5"
            >
                <Forward size={14} />
                Inoltra
            </button>
        </div>
    )
}
