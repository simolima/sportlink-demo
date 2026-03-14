import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import HomeClientDashboard from '@/components/dashboard-ui/HomeClientDashboard'

export default async function HomePage() {
    const client = await createServerClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await client
        .from('profiles')
        .select('role_id, first_name, last_name')
        .eq('id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

    if (!profile || !profile.role_id || !profile.first_name || !profile.last_name) {
        redirect('/complete-profile')
    }

    const userId = user.id
    const userRole = profile.role_id.toLowerCase()
    const userName = `${profile.first_name} ${profile.last_name}`

    return <HomeClientDashboard userId={userId} userRole={userRole} userName={userName} />
}
