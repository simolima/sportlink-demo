"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/hooks/useAuth'

export default function ProfilePage() {
    const router = useRouter()
    const { user, isLoading } = useRequireAuth(true)

    useEffect(() => {
        // Redirect to the user's own profile page with ID
        if (user && user.id) {
            router.push(`/profile/${user.id}`)
        }
    }, [user, router])

    if (isLoading || !user) {
        return null
    }

    return null
}
