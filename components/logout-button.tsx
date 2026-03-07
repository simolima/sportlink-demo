'use client'
import { useRouter } from 'next/navigation'
import { clearActiveRole } from '@/app/actions/role-actions'

const LOCAL_STORAGE_KEYS = [
    'currentUserId', 'currentUserName', 'currentUserEmail',
    'currentUserAvatar', 'currentUserRole', 'currentUserSport',
    'currentUserSports', 'onboarding_complete', 'selectedClubId',
]

export default function LogoutButton() {
    const router = useRouter()
    const isClient = typeof window !== 'undefined'
    const id = isClient ? localStorage.getItem('currentUserId') : null
    if (!id) return null
    const logout = async () => {
        if (typeof window === 'undefined') return
        // Cancella cookie server-side
        try { await clearActiveRole() } catch { /* ignore */ }
        // Cancella Supabase session
        try {
            const { supabase } = await import('@/lib/supabase-browser')
            await supabase.auth.signOut()
        } catch { /* ignore */ }
        // Pulisci tutto localStorage
        LOCAL_STORAGE_KEYS.forEach(k => localStorage.removeItem(k))
        window.location.href = '/'
    }

    return (
        <button onClick={logout} className="text-sm px-3 py-1 border rounded text-white border-white hover:bg-white/10">Logout</button>
    )
}
