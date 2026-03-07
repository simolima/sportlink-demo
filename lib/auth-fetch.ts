import { supabase } from '@/lib/supabase-browser'

/**
 * Returns headers with Authorization Bearer token if a valid session exists.
 * Use this in all client-side fetch calls to authenticated API routes.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return {}
    return { 'Authorization': `Bearer ${session.access_token}` }
}
