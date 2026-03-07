'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck } from 'lucide-react'

interface VerifyButtonProps {
    targetId: string | number
    currentUserId: string | null
}

export default function VerifyButton({ targetId, currentUserId }: VerifyButtonProps) {
    const [isVerified, setIsVerified] = useState(false)
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        if (!currentUserId || !targetId) return
        fetch(`/api/verifications?verifierId=${currentUserId}&verifiedId=${targetId}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : []
                setIsVerified(list.length > 0)
            })
            .catch(() => { })
    }, [currentUserId, targetId])

    if (!currentUserId || String(currentUserId) === String(targetId)) return null

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (loading) return
        if (isVerified) {
            // Toggle off immediately (confirmed state)
            handleRemove()
        } else {
            // Two-step: first click shows confirm state
            setConfirming(true)
        }
    }

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setConfirming(false)
        setLoading(true)
        try {
            await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifierId: currentUserId, verifiedId: targetId }),
            })
            setIsVerified(true)
        } catch {
            // silent fail
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async () => {
        setLoading(true)
        try {
            await fetch(`/api/verifications?verifierId=${currentUserId}&verifiedId=${targetId}`, { method: 'DELETE' })
            setIsVerified(false)
        } catch {
            // silent fail
        } finally {
            setLoading(false)
        }
    }

    const handleCancelConfirm = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setConfirming(false)
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleConfirm}
                    className="text-[11px] font-semibold px-2 py-1 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition"
                >
                    Conferma
                </button>
                <button
                    onClick={handleCancelConfirm}
                    className="text-[11px] px-1.5 py-1 rounded-full text-gray-400 hover:text-gray-600 transition"
                >
                    ✕
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            aria-label={isVerified ? 'Revoca verifica' : 'Verifica profilo'}
            className={`p-1.5 rounded-full border transition-all duration-150 ${isVerified
                    ? 'bg-brand-50 border-brand-300 text-brand-600 hover:bg-brand-100'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <BadgeCheck className={`w-4 h-4 ${isVerified ? 'fill-brand-100' : ''}`} />
        </button>
    )
}
