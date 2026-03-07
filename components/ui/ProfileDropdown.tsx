'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    UserCircleIcon,
    ChevronDownIcon,
    PlusCircleIcon,
    ArrowsRightLeftIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { switchActiveRole } from '@/app/actions/role-actions'
import { ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'

interface ProfileRole {
    role_id: string
    is_primary: boolean
    sport_names?: string[]
}

/** Format sport list for display in the dropdown row */
function formatSports(names: string[] | undefined): string {
    if (!names || names.length === 0) return ''
    if (names.length <= 2) return names.join(', ')
    return `${names.length} sport`
}

export default function ProfileDropdown() {
    const { user, logout } = useAuth()
    const router = useRouter()
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
    const currentRoleEntry = roles.find(r => r.role_id === currentRole)
    const currentRoleLabel = ROLE_TRANSLATIONS[currentRole] ?? currentRole
    const currentSportLabel = formatSports(currentRoleEntry?.sport_names)
    const otherRoles = roles.filter(r => r.role_id !== currentRole)

    function handleSwitchRole(roleId: string) {
        startTransition(async () => {
            try {
                await switchActiveRole(roleId as ProfessionalRole)
                localStorage.setItem('currentUserRole', roleId)
                setOpen(false)
                // Naviga a /home per aggiornare il contesto completo
                window.location.href = '/home'
            } catch (err: any) {
                console.error('Switch role failed:', err)
                alert(err?.message || 'Errore nel cambio ruolo')
            }
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
                    <ArrowPathIcon className="w-5 h-5 animate-spin text-brand-600" />
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
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-base-200 bg-white shadow-lg z-50 py-2">
                    {/* Header: utente + ruolo attivo */}
                    <div className="px-4 py-3 border-b border-base-200">
                        <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                                <Avatar src={user.avatarUrl} alt={user.firstName} size="sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-brand-600 font-medium">
                                    {currentRoleLabel}{currentSportLabel ? ` · ${currentSportLabel}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profili / Ruoli — mostra tutti, evidenzia quello attivo */}
                    {roles.length > 0 && (
                        <div className="py-1">
                            <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                {otherRoles.length > 0 ? 'I tuoi profili' : 'Profilo attivo'}
                            </p>
                            {roles.map((r) => {
                                const isActive = r.role_id === currentRole
                                const label = ROLE_TRANSLATIONS[r.role_id as ProfessionalRole] ?? r.role_id
                                return (
                                    <button
                                        key={r.role_id}
                                        onClick={() => {
                                            if (isActive) {
                                                setOpen(false)
                                                return
                                            }
                                            handleSwitchRole(r.role_id)
                                        }}
                                        disabled={isPending && !isActive}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors ${isActive
                                            ? 'bg-brand-50 text-brand-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {isActive ? (
                                            <CheckCircleIcon className="w-4 h-4 text-brand-600 shrink-0" />
                                        ) : (
                                            <ArrowsRightLeftIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {label}
                                            {formatSports(r.sport_names) && (
                                                <span className={isActive ? 'text-brand-500' : 'text-gray-400'}> · {formatSports(r.sport_names)}</span>
                                            )}
                                        </span>
                                        {isPending && !isActive && (
                                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-brand-600 ml-auto shrink-0" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <div className="border-t border-base-200 my-1" />

                    {/* Visualizza profilo */}
                    <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                        Visualizza profilo
                    </Link>

                    {/* Aggiungi nuovo profilo */}
                    <Link
                        href="/profile/add-role"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors font-medium"
                    >
                        <PlusCircleIcon className="w-4 h-4 text-brand-600" />
                        Aggiungi nuovo profilo
                    </Link>

                    <div className="border-t border-base-200 my-1" />

                    {/* Logout */}
                    <button
                        onClick={() => {
                            setOpen(false)
                            logout()
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                        <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                        Esci
                    </button>
                </div>
            )}
        </div>
    )
}
