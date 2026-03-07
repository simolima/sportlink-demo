import { supabase } from '@/lib/supabase-browser'

/**
 * Returns headers with Authorization Bearer token if a valid session exists.
 * Use this in all client-side fetch calls to authenticated API routes.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    let { data: { session } } = await supabase.auth.getSession()

    const isExpired = !!session?.expires_at && session.expires_at * 1000 <= Date.now()
    if (!session?.access_token || isExpired) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        session = refreshed?.session ?? null
    }

    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
}
