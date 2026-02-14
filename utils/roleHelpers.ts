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

// Helper: Mappa i ruoli frontend (es: "Player") ai ruoli database (es: "player")
export function mapRoleToDatabase(frontendRole: string): string {
    const roleMap: Record<string, string> = {
        'Player': 'player',
        'Coach': 'coach',
        'Agent': 'agent',
        'Sporting Director': 'sporting_director',
        'Athletic Trainer': 'athletic_trainer',
        'Nutritionist': 'nutritionist',
        'Physio/Masseur': 'physio',
        'Talent Scout': 'talent_scout'
    }
    return roleMap[frontendRole] || frontendRole.toLowerCase().replace(/\s+/g, '_')
}
