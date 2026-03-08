'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSelectedClubStorageKey } from '@/lib/club-membership-scope'

export default function ClubApplicationsRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  useEffect(() => {
    // Preserve the selected club for the unified applications page
    if (clubId) {
      const activeRole = localStorage.getItem('currentUserRole')
      const selectedClubStorageKey = getSelectedClubStorageKey(activeRole)
      localStorage.setItem(selectedClubStorageKey, clubId)
      localStorage.setItem('selectedClubId', clubId)
    }
    router.replace('/club-applications')
  }, [clubId, router])

  return (
    <div className="min-h-screen glass-page-bg flex items-center justify-center px-4 text-base-content">
      <div className="text-center glass-subtle-text">
        Reindirizzamento alla gestione candidature...
      </div>
    </div>
  )
}
