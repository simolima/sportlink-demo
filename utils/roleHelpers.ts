// Utility per ruoli e sport Sprinta


import { PROFESSIONAL_ROLES, SUPPORTED_SPORTS, ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'
export { PROFESSIONAL_ROLES, SUPPORTED_SPORTS, ROLE_TRANSLATIONS }

const ROLE_DB_MAP: Record<ProfessionalRole, string> = {
    'Player': 'player',
    'Coach': 'coach',
    'Agent': 'agent',
    'Sporting Director': 'sporting_director',
    'Athletic Trainer': 'athletic_trainer',
    'Nutritionist': 'nutritionist',
    'Physio/Masseur': 'physio_masseur',
    'Talent Scout': 'talent_scout'
}

export function isMultiSportRole(role: ProfessionalRole): boolean {
    return (
        role === 'Agent' ||
        role === 'Athletic Trainer' ||
        role === 'Nutritionist' ||
        role === 'Physio/Masseur'
    )
}

export function mapRoleToDatabase(role: ProfessionalRole): string {
    return ROLE_DB_MAP[role] ?? role
}
