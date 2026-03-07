'use client'

import { useTransition } from 'react'
import {
    UserIcon,
    ShieldCheckIcon,
    HeartIcon,
    BriefcaseIcon,
    StarIcon,
    BuildingOfficeIcon,
    ScaleIcon,
    MagnifyingGlassCircleIcon,
    ChevronDownIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { switchActiveRole } from '@/app/actions/role-actions'
import { ROLE_TRANSLATIONS, type ProfessionalRole } from '@/lib/types'

// Mappa ogni ruolo alla sua icona Heroicons
const ROLE_ICONS: Record<ProfessionalRole, React.ComponentType<{ className?: string }>> = {
    player: UserIcon,
    coach: ShieldCheckIcon,
    agent: BriefcaseIcon,
    sporting_director: BuildingOfficeIcon,
    athletic_trainer: StarIcon,
    nutritionist: ScaleIcon,
    physio: HeartIcon,
    talent_scout: MagnifyingGlassCircleIcon,
}

interface RoleSwitcherProps {
    /** Ruolo correntemente attivo, letto dal cookie nel Server Component parent. */
    activeRole: ProfessionalRole
    /** Lista dei ruoli a disposizione dell'utente. */
    availableRoles: ProfessionalRole[]
}

export default function RoleSwitcher({ activeRole, availableRoles }: RoleSwitcherProps) {
    const [isPending, startTransition] = useTransition()

    const ActiveIcon = ROLE_ICONS[activeRole] ?? UserIcon
    const activeLabel = ROLE_TRANSLATIONS[activeRole] ?? activeRole

    function handleSwitch(roleId: ProfessionalRole) {
        if (roleId === activeRole || isPending) return
        startTransition(async () => {
            try {
                await switchActiveRole(roleId)
            } catch (err: any) {
                console.error('Switch role failed:', err)
            }
        })
    }

    return (
        <div className="dropdown dropdown-end">
            {/* Bottone trigger */}
            <button
                tabIndex={0}
                role="button"
                disabled={isPending}
                className="btn btn-ghost btn-sm gap-2 border border-base-300 hover:border-brand-500 hover:bg-brand-50 transition-colors"
                aria-label="Cambia ruolo attivo"
                aria-haspopup="true"
            >
                {isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin text-brand-600" />
                ) : (
                    <ActiveIcon className="h-4 w-4 text-brand-600" />
                )}
                <span className="text-sm font-medium text-gray-700">{activeLabel}</span>
                <ChevronDownIcon className="h-3 w-3 text-gray-400" />
            </button>

            {/* Menu a tendina */}
            <ul
                tabIndex={0}
                className="dropdown-content menu menu-sm z-30 mt-2 w-56 rounded-xl border border-base-200 bg-white p-1.5 shadow-lg"
            >
                {availableRoles.map((roleId) => {
                    const Icon = ROLE_ICONS[roleId] ?? UserIcon
                    const isActive = roleId === activeRole

                    return (
                        <li key={roleId}>
                            <button
                                onClick={() => handleSwitch(roleId)}
                                disabled={isPending}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left
                                    ${isActive
                                        ? 'bg-brand-50 font-semibold text-brand-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                                {ROLE_TRANSLATIONS[roleId] ?? roleId}
                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                                )}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
