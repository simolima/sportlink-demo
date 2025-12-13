'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ClubApplicationsRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  useEffect(() => {
    // Preserve the selected club for the unified applications page
    if (clubId) {
      localStorage.setItem('selectedClubId', clubId)
    }
    router.replace('/club-applications')
  }, [clubId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center text-gray-600">
        Reindirizzamento alla gestione candidature...
      </div>
    </div>
  )
}
