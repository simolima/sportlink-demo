"use client"

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

export default function StudioDashboardIndexPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const studioId = params.id as string

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'edit') {
            router.replace(`/studios/${studioId}/dashboard/settings`)
            return
        }
        if (tab === 'appointments' || tab === 'clients') {
            router.replace(`/studios/${studioId}/dashboard/bookings`)
            return
        }

        router.replace(`/studios/${studioId}/dashboard/overview`)
    }, [router, searchParams, studioId])

    return null
}
