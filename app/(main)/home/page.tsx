import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import HomeClientDashboard from '@/components/dashboard-ui/HomeClientDashboard'

export default async function HomePage() {
    const client = await createServerClient()
    const { data: { session } } = await client.auth.getSession()

    if (!session) redirect('/login')

    const { data: profile } = await client
        .from('profiles')
        .select('role_id, first_name, last_name')
        .eq('id', session.user.id)
        .is('deleted_at', null)
        .maybeSingle()

    if (!profile || !profile.role_id || !profile.first_name || !profile.last_name) {
        redirect('/complete-profile')
    }

    const userId = session.user.id
    const userRole = profile.role_id.toLowerCase()
    const userName = `${profile.first_name} ${profile.last_name}`

    return <HomeClientDashboard userId={userId} userRole={userRole} userName={userName} />
}
