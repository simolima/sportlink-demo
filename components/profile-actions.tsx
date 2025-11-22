'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import FollowButton from './follow-button'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

interface ProfileActionsProps {
    userId: number
}

export default function ProfileActions({ userId }: ProfileActionsProps) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const id = localStorage.getItem('currentUserId')
            setCurrentUserId(id)
            setIsLoaded(true)
        }
    }, [])

    if (!isLoaded) {
        return (
            <div className="flex gap-3">
                <div className="h-11 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
        )
    }

    const isOwn = currentUserId && String(currentUserId) === String(userId)

    return (
        <div className="flex gap-3">
            {!isOwn && <FollowButton targetId={userId} />}
            {!isOwn && (
                <Link 
                    href={`/messages/${userId}`} 
                    className="px-4 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition font-semibold"
                >
                    Messaggia
                </Link>
            )}
            {isOwn && (
                <Link
                    href="/profile/edit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium"
                >
                    <PencilSquareIcon className="w-5 h-5" />
                    Modifica Profilo
                </Link>
            )}
        </div>
    )
}
