// Utility per ruoli e sport Sprinta


import { PROFESSIONAL_ROLES, SUPPORTED_SPORTS, ROLE_TRANSLATIONS, ProfessionalRole } from '@/lib/types'
export { PROFESSIONAL_ROLES, SUPPORTED_SPORTS, ROLE_TRANSLATIONS }

export function isMultiSportRole(role: ProfessionalRole): boolean {
    return (
        role === 'Agent' ||
        role === 'Athletic Trainer' ||
        role === 'Nutritionist' ||
        role === 'Physio/Masseur'
    )
}
