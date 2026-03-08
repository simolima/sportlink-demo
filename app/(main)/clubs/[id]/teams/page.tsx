"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import TeamManagementWidget from '@/components/club-admin/TeamManagementWidget'

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton di caricamento
// ─────────────────────────────────────────────────────────────────────────────
function TeamManagementSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-base-300" />
            {[1, 2].map((i) => (
                <div key={i} className="card glass-widget border border-base-300/70 shadow-sm p-5">
                    <div className="h-5 w-32 rounded bg-base-300 mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded bg-base-200" />
                        <div className="h-4 w-3/4 rounded bg-base-200" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function ClubTeamsPage() {
    const router = useRouter()
    const params = useParams()
    const clubId = params?.id as string

    const [userId, setUserId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!clubId) return

        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }
        setUserId(id)

        // Verifica accesso admin client-side (stessa logica della pagina club)
        async function checkAccess() {
            try {
                // 1. Verifica ownership del club
                const clubRes = await fetch('/api/clubs')
                const clubs = await clubRes.json()
                const club = clubs.find((c: any) => String(c.id) === String(clubId))

                const isOwner = club && (
                    String(club.created_by) === id ||
                    String(club.owner_id) === id ||
                    String(club.createdBy) === id
                )

                if (isOwner) {
                    setIsAdmin(true)
                    setLoading(false)
                    return
                }

                // 2. Verifica membership Admin
                const membersRes = await fetch(`/api/club-memberships?clubId=${clubId}`)
                const members = await membersRes.json()
                const hasAdminMembership = members.some(
                    (m: any) => String(m.userId) === id && m.role === 'Admin' && m.isActive
                )

                if (hasAdminMembership) {
                    setIsAdmin(true)
                    setLoading(false)
                    return
                }

                // Non è admin → redirect alla pagina club
                router.push(`/clubs/${clubId}`)
            } catch {
                router.push(`/clubs/${clubId}`)
            }
        }

        checkAccess()
    }, [clubId, router])

    if (loading) {
        return (
            <div className="min-h-screen glass-page-bg">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    <TeamManagementSkeleton />
                </div>
            </div>
        )
    }

    if (!isAdmin || !userId) return null

    return (
        <div className="min-h-screen glass-page-bg text-base-content">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* ── Breadcrumb / Back ── */}
                <Link
                    href={`/clubs/${clubId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-base-content mb-6 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Torna alla scheda club
                </Link>

                {/* ── Header ── */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-full bg-brand-100 p-2">
                        <UserGroupIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-base-content">Gestione Squadre</h1>
                        <p className="text-sm glass-subtle-text mt-0.5">
                            Organizza i tesserati in squadre e gestisci la rosa.
                        </p>
                    </div>
                </div>

                {/* ── Widget principale ── */}
                <TeamManagementWidget clubId={clubId} userId={userId} />
            </div>
        </div>
    )
}
