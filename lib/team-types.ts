import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Costanti & Tipi — condivisi tra client e server
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_MEMBER_ROLES = [
    'player',
    'head_coach',
    'assistant_coach',
    'athletic_trainer',
    'physio',
    'nutritionist',
    'team_manager',
    'goalkeeper_coach',
] as const

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number]

export const TEAM_MEMBER_ROLE_LABELS: Record<TeamMemberRole, string> = {
    player: 'Giocatore',
    head_coach: 'Allenatore',
    assistant_coach: 'Ass. Allenatore',
    athletic_trainer: 'Prep. Atletico',
    physio: 'Fisioterapista',
    nutritionist: 'Nutrizionista',
    team_manager: 'Team Manager',
    goalkeeper_coach: 'All. Portieri',
}

export type TeamActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod
// ─────────────────────────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
    clubId: z.string().uuid('ID club non valido'),
    name: z
        .string()
        .min(1, 'Il nome della squadra è obbligatorio')
        .max(100, 'Nome troppo lungo (max 100 caratteri)'),
    category: z.string().max(80, 'Categoria troppo lunga').nullable().optional(),
    season: z.string().max(20, 'Stagione troppo lunga').nullable().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

export const assignMemberSchema = z.object({
    teamId: z.string().uuid('ID squadra non valido'),
    profileId: z.string().uuid('ID profilo non valido'),
    role: z.enum(TEAM_MEMBER_ROLES, {
        required_error: 'Ruolo obbligatorio',
        invalid_type_error: 'Ruolo non valido',
    }),
})

export type AssignMemberInput = z.infer<typeof assignMemberSchema>
