'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import PostComposer from './post-composer'
import dynamic from 'next/dynamic'

const FeedClient = dynamic(() => import('./feed-client'), { ssr: false })

export default function HomeBody() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    useEffect(() => {
        setCurrentUserId(typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null)
    }, [])

    if (!currentUserId) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Benvenuto su SportLink</h1>
                <p className="text-gray-600 mb-6">Crea il tuo profilo per iniziare a seguire persone, pubblicare aggiornamenti e trovare match.</p>
                <div className="flex items-center justify-center gap-4">
                    <Link href="/create-profile" className="px-5 py-3 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 text-white">Crea profilo</Link>
                    <Link href="/login" className="px-5 py-3 rounded-full border">Accedi</Link>
                </div>
            </div>
        )
    }

    return (
        <main className="max-w-3xl mx-auto p-4 space-y-6">
            <PostComposer />
            <FeedClient />
        </main>
    )
}
