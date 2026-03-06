// Server Component — nessuna direttiva 'use client'
import { Suspense } from 'react'
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import TeamManagementWidget from '@/components/club-admin/TeamManagementWidget'

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — mostrato da Suspense mentre TeamManagementWidget carica
// ─────────────────────────────────────────────────────────────────────────────
function TeamManagementSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-gray-200" />
            {[1, 2].map((i) => (
                <div key={i} className="card bg-white border border-base-200 shadow-sm p-5">
                    <div className="h-5 w-32 rounded bg-gray-200 mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded bg-gray-100" />
                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifica server-side se l'utente loggato è Admin/DS del club
// ─────────────────────────────────────────────────────────────────────────────
async function checkAdminAccess(clubId: string): Promise<boolean> {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    // 1. È il proprietario del club?
    const { data: ownedClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('id', clubId)
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

    if (ownedClub) return true

    // 2. Ha membership Admin?
    const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_role, profiles!club_memberships_user_id_fkey(role_id)')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle()

    if (!membership) return false
    if (membership.club_role === 'Admin') return true

    // 3. È Staff con ruolo sporting_director?
    const profile = Array.isArray(membership.profiles)
        ? membership.profiles[0]
        : membership.profiles
    return (profile as any)?.role_id === 'sporting_director'
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    params: { id: string }
}

export default async function ClubTeamsPage({ params }: Props) {
    const clubId = params.id

    const hasAccess = await checkAdminAccess(clubId)
    if (!hasAccess) {
        redirect(`/clubs/${clubId}`)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* ── Breadcrumb / Back ── */}
                <Link
                    href={`/clubs/${clubId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Torna alla scheda club
                </Link>

                {/* ── Header ── */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                        <UserGroupIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestione Squadre</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Organizza i tesserati in squadre e gestisci la rosa.
                        </p>
                    </div>
                </div>

                {/* ── Widget principale ── */}
                <Suspense fallback={<TeamManagementSkeleton />}>
                    <TeamManagementWidget clubId={clubId} />
                </Suspense>
            </div>
        </div>
    )
}
