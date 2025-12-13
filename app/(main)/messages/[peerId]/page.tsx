"use client"

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Redirect alla pagina messaggi unificata
 * 
 * Manteniamo questa route per retrocompatibilità con eventuali link esistenti.
 * Reindirizza a /messages?chat=<peerId>
 */
export default function ChatWithPeerPage() {
    const params = useParams()
    const router = useRouter()
    const peerId = params?.peerId as string

    useEffect(() => {
        if (peerId) {
            router.replace(`/messages?chat=${peerId}`)
        } else {
            router.replace('/messages')
        }
    }, [peerId, router])

    // Loading durante il redirect
    return (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#2341F0] border-t-transparent rounded-full" />
        </div>
    )
}
