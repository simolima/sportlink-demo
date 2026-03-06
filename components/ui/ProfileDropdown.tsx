'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import {
    UserCircleIcon,
    ChevronDownIcon,
    PlusCircleIcon,
    ArrowsRightLeftIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { switchActiveRole } from '@/app/actions/role-actions'
import { ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'

interface ProfileRole {
    role_id: string
    is_primary: boolean
}

export default function ProfileDropdown() {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [roles, setRoles] = useState<ProfileRole[]>([])
    const [isPending, startTransition] = useTransition()
    const ref = useRef<HTMLDivElement>(null)

    // Chiudi il dropdown al click fuori
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch dei ruoli disponibili dall'API
    useEffect(() => {
        if (!user?.id) return
        fetch(`/api/users/roles?userId=${user.id}`)
            .then(res => res.ok ? res.json() : [])
            .then((data: ProfileRole[]) => setRoles(data))
            .catch(() => { })
    }, [user?.id])

    if (!user) return null

    const currentRole = user.professionalRole?.toLowerCase() as ProfessionalRole
    const currentRoleLabel = ROLE_TRANSLATIONS[currentRole] ?? currentRole
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
    const otherRoles = roles.filter(r => r.role_id !== currentRole)

    function handleSwitchRole(roleId: string) {
        setOpen(false)
        startTransition(async () => {
            await switchActiveRole(roleId as ProfessionalRole)
            // Aggiorna localStorage per compatibilità
            localStorage.setItem('currentUserRole', roleId)
            window.location.reload()
        })
    }

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex flex-col items-center text-secondary text-xs font-semibold hover:text-primary transition"
                aria-haspopup="true"
                aria-expanded={open}
            >
                {isPending ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin text-green-600" />
                ) : user.avatarUrl ? (
                    <Avatar src={user.avatarUrl} alt={user.firstName} size="xs" />
                ) : (
                    <UserCircleIcon className="w-5 h-5" />
                )}
                <span className="mt-1 flex items-center gap-0.5">
                    Profilo
                    <ChevronDownIcon className="w-3 h-3" />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-base-200 bg-white shadow-lg z-50 py-2">
                    {/* Header: utente + ruolo attivo */}
                    <div className="px-4 py-2 border-b border-base-200">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-green-600 font-medium">{currentRoleLabel}</p>
                    </div>

                    {/* Visualizza profilo */}
                    <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                        Visualizza profilo
                    </Link>

                    {/* Switch ruolo (se ha più di un ruolo) */}
                    {otherRoles.length > 0 && (
                        <>
                            <div className="border-t border-base-200 my-1" />
                            <p className="px-4 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                Cambia profilo
                            </p>
                            {otherRoles.map((r) => (
                                <button
                                    key={r.role_id}
                                    onClick={() => handleSwitchRole(r.role_id)}
                                    disabled={isPending}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                                >
                                    <ArrowsRightLeftIcon className="w-4 h-4 text-gray-400" />
                                    {ROLE_TRANSLATIONS[r.role_id as ProfessionalRole] ?? r.role_id}
                                </button>
                            ))}
                        </>
                    )}

                    {/* Aggiungi nuovo profilo */}
                    <div className="border-t border-base-200 my-1" />
                    <Link
                        href="/profile/add-role"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                    >
                        <PlusCircleIcon className="w-4 h-4 text-green-600" />
                        Aggiungi nuovo profilo
                    </Link>
                </div>
            )}
        </div>
    )
}
