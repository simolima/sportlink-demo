/**
 * Auth Service - Gestione autenticazione e creazione utenti
 * Questo file isola la logica di creazione utente per facilitare
 * la futura migrazione a Supabase.
 */

import type { CreateUserPayload, CreatedUser } from '@/lib/types'

// Re-export types per comodità
export type { CreateUserPayload, CreatedUser }

/**
 * Crea un nuovo utente via API
 * @param payload - Dati dell'utente da creare
 * @returns L'utente creato
 * @throws Error se la creazione fallisce
 */
export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    if (!res.ok) {
        throw new Error('Errore nella creazione del profilo')
    }

    const newUser = await res.json()
    return newUser
}
