"use client"

import { useState } from 'react'

interface SharePostModalProps {
    postId: string
    isOpen: boolean
    onClose: () => void
}

export default function SharePostModal({ postId, isOpen, onClose }: SharePostModalProps) {
    const [copied, setCopied] = useState(false)

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/home`

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Condividi Post</h3>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={handleCopy}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                        {copied ? '✓ Copiato!' : 'Copia Link'}
                    </button>

                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'SportLink',
                                    text: 'Guarda questo post su SportLink',
                                    url: shareUrl,
                                })
                            }
                        }}
                        className="w-full px-4 py-2 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                        Condividi
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
                >
                    Chiudi
                </button>
            </div>
        </div>
    )
}
