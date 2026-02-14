'use client'

import { useEffect, useState } from 'react'
import PlayerRepresentation from './player-representation'

interface ProfileRepresentationWrapperProps {
    profileUserId: string | number
    profileUserRole?: string
}

export default function ProfileRepresentationWrapper({
    profileUserId,
    profileUserRole
}: ProfileRepresentationWrapperProps) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const id = localStorage.getItem('currentUserId')
            setCurrentUserId(id)
            setIsLoading(false)
        }
    }, [])

    // Non mostrare nulla se non è un Player (case-insensitive check)
    const role = String(profileUserRole || '').trim().toLowerCase()
    if (role !== 'player') {
        return null
    }

    if (isLoading) {
        return null
    }

    const isOwnProfile = currentUserId === String(profileUserId)

    return (
        <PlayerRepresentation
            playerId={String(profileUserId)}
            isOwnProfile={isOwnProfile}
        />
    )
}
