'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Users, Trash2, Shield } from 'lucide-react'
import { ClubMembership, Club, User, CLUB_ROLES, CLUB_PERMISSIONS } from '@/lib/types'
import { useToast } from '@/lib/toast-context'

interface MembershipWithUser extends ClubMembership {
  user: User | null
}

export default function ClubMembersPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const clubId = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<MembershipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) {
      router.push('/login')
      return
    }
    setCurrentUserId(parseInt(userId))
    fetchData(parseInt(userId))
  }, [clubId])

  const fetchData = async (userId: number) => {
    setLoading(true)
    try {
      // Fetch club
      const clubRes = await fetch(`/api/clubs`)
      const clubs = await clubRes.json()
      const foundClub = clubs.find((c: any) => c.id.toString() === clubId)
      setClub(foundClub)

      // Fetch memberships
      const membersRes = await fetch(`/api/club-memberships?clubId=${clubId}`)
      const membersData = await membersRes.json()
      setMembers(membersData)

      // Check if current user is admin
      const userMembership = membersData.find((m: any) => m.userId === userId)
      if (userMembership && userMembership.role === 'Admin') {
        setIsAdmin(true)
      } else {
        showToast('error', 'Accesso negato', 'Solo gli admin possono gestire i membri')
        router.push(`/clubs/${clubId}`)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile caricare i dati')
    } finally {
      setLoading(false)
    }
  }

  const updateMemberPermissions = async (membershipId: number, newPermissions: string[]) => {
    try {
      const res = await fetch('/api/club-memberships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: membershipId, permissions: newPermissions }),
      })

      if (res.ok) {
        showToast('success', 'Permessi aggiornati', 'I permessi del membro sono stati modificati')
        if (currentUserId) fetchData(currentUserId)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile aggiornare i permessi')
    }
  }

  const removeMember = async (membershipId: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questo membro?')) return

    try {
      const res = await fetch(`/api/club-memberships?id=${membershipId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('success', 'Membro rimosso', 'Il membro è stato rimosso dal club')
        if (currentUserId) fetchData(currentUserId)
      }
    } catch (error) {
      showToast('error', 'Errore', 'Impossibile rimuovere il membro')
    }
  }

  const togglePermission = (membershipId: number, currentPermissions: string[], permission: string) => {
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission]
    updateMemberPermissions(membershipId, newPermissions)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Caricamento...</div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna al club
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} />
          <h1 className="text-3xl font-bold">Gestione Membri</h1>
        </div>
        <p className="text-gray-600">{club?.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">{members.length} Membri</h2>
        </div>

        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={member.user?.avatarUrl || '/default-avatar.png'}
                    alt={`${member.user?.firstName} ${member.user?.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {member.user?.firstName} {member.user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                    {member.position && (
                      <p className="text-xs text-gray-500">{member.position}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">Permessi:</p>
                  <div className="flex flex-wrap gap-2">
                    {CLUB_PERMISSIONS.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={member.permissions.includes(permission)}
                          onChange={() =>
                            togglePermission(
                              typeof member.id === 'number' ? member.id : parseInt(member.id),
                              member.permissions,
                              permission
                            )
                          }
                          className="rounded"
                          disabled={member.role === 'Admin'}
                        />
                        <span>{permission.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {member.role !== 'Admin' && (
                  <button
                    onClick={() =>
                      removeMember(
                        typeof member.id === 'number' ? member.id : parseInt(member.id)
                      )
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Rimuovi membro"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
