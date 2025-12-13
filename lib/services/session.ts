/**
 * Session & Signup Draft Management
 * 
 * Gestisce le operazioni localStorage per la sessione utente
 * e la pulizia dei dati temporanei di registrazione.
 * 
 * NOTA: Preparazione per migrazione Supabase.
 * Le chiavi localStorage NON devono essere modificate.
 */

// ─────────────────────────────────────────────────────────────
// Session Keys (esistenti nel progetto)
// ─────────────────────────────────────────────────────────────

const SESSION_KEYS = {
    userId: 'currentUserId',
    email: 'currentUserEmail',
    name: 'currentUserName',
    avatar: 'currentUserAvatar',
    role: 'currentUserRole',
    sports: 'currentUserSports',
} as const

// ─────────────────────────────────────────────────────────────
// Signup Draft Keys (dati temporanei registrazione)
// ─────────────────────────────────────────────────────────────

const SIGNUP_DRAFT_KEYS = [
    'signup_firstName',
    'signup_lastName',
    'signup_email',
    'signup_password',
    'signup_birthDate',
] as const

// ─────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────

export interface SetSessionParams {
    id: string
    email?: string
    name?: string
    avatar?: string
    role?: string
    sports?: string[]
}

/**
 * Imposta i dati della sessione utente in localStorage.
 * 
 * @param params - Dati utente da salvare
 * - id: obbligatorio, viene salvato come currentUserId
 * - email, name, avatar, role, sports: opzionali
 */
export function setCurrentUserSession(params: SetSessionParams): void {
    const { id, email, name, avatar, role, sports } = params

    // ID è sempre obbligatorio
    localStorage.setItem(SESSION_KEYS.userId, id)

    // Campi opzionali
    if (email !== undefined) {
        localStorage.setItem(SESSION_KEYS.email, email)
    }
    if (name !== undefined) {
        localStorage.setItem(SESSION_KEYS.name, name)
    }
    if (avatar !== undefined) {
        localStorage.setItem(SESSION_KEYS.avatar, avatar)
    }
    if (role !== undefined) {
        localStorage.setItem(SESSION_KEYS.role, role)
    }
    if (sports !== undefined) {
        localStorage.setItem(SESSION_KEYS.sports, JSON.stringify(sports))
    }
}

// ─────────────────────────────────────────────────────────────
// Signup Draft Cleanup
// ─────────────────────────────────────────────────────────────

/**
 * Rimuove tutti i dati temporanei di registrazione da localStorage.
 * 
 * Keys rimosse:
 * - signup_firstName
 * - signup_lastName
 * - signup_email
 * - signup_password
 * - signup_birthDate
 */
export function clearSignupDraft(): void {
    for (const key of SIGNUP_DRAFT_KEYS) {
        localStorage.removeItem(key)
    }
}
