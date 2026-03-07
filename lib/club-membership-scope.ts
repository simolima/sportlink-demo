import { PROFESSIONAL_ROLES, type ProfessionalRole } from '@/lib/types'

const CLUB_ADMIN_PROFESSIONAL_ROLES: ProfessionalRole[] = [
    'coach',
    'sporting_director',
    'athletic_trainer',
    'nutritionist',
    'physio',
    'talent_scout',
]

function isProfessionalRole(value: string): value is ProfessionalRole {
    return PROFESSIONAL_ROLES.includes(value as ProfessionalRole)
}

export function normalizeProfessionalRoleId(roleId?: string | null): ProfessionalRole | null {
    if (!roleId) return null
    const normalized = String(roleId).trim().toLowerCase()
    return isProfessionalRole(normalized) ? normalized : null
}

export function defaultProfessionalRoleForClubRole(clubRole?: string | null): ProfessionalRole {
    if (clubRole === 'Player') return 'player'
    return 'coach'
}

export function resolveMembershipProfessionalRoleId(params: {
    requestedProfessionalRoleId?: string | null
    profileRoleId?: string | null
    clubRole?: string | null
}): ProfessionalRole {
    const requested = normalizeProfessionalRoleId(params.requestedProfessionalRoleId)
    if (requested) return requested

    if (params.clubRole === 'Player') return 'player'

    const profileRole = normalizeProfessionalRoleId(params.profileRoleId)
    if (profileRole && profileRole !== 'player' && profileRole !== 'agent') return profileRole

    return defaultProfessionalRoleForClubRole(params.clubRole)
}

export function isClubAdminProfessionalRole(roleId?: string | null): boolean {
    const normalized = normalizeProfessionalRoleId(roleId)
    return !!normalized && CLUB_ADMIN_PROFESSIONAL_ROLES.includes(normalized)
}

export function getSelectedClubStorageKey(activeRole?: string | null): string {
    const normalized = normalizeProfessionalRoleId(activeRole)
    return normalized ? `selectedClubId:${normalized}` : 'selectedClubId'
}

export function syncLegacySelectedClubIdForRole(activeRole?: string | null) {
    if (typeof window === 'undefined') return

    const scopedKey = getSelectedClubStorageKey(activeRole)
    const scopedValue = localStorage.getItem(scopedKey)

    if (scopedValue) {
        localStorage.setItem('selectedClubId', scopedValue)
        return
    }

    localStorage.removeItem('selectedClubId')
}

export function membershipMatchesActiveProfessionalRole(
    membership: { role?: string; professionalRoleId?: string | null },
    activeRole?: string | null,
): boolean {
    const normalizedActiveRole = normalizeProfessionalRoleId(activeRole)
    if (!normalizedActiveRole) return true

    const membershipRoleId = normalizeProfessionalRoleId(membership.professionalRoleId)
    if (membershipRoleId) return membershipRoleId === normalizedActiveRole

    if (normalizedActiveRole === 'agent') return false
    if (normalizedActiveRole === 'player') return membership.role === 'Player'
    return membership.role === 'Admin' || membership.role === 'Staff'
}
