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
    console.log('🚀 Creating user with payload:', payload)
    console.log('📋 Sports being sent:', payload.sports)

    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as any))
        console.error('❌ API error:', errorData)
        throw new Error(
            errorData?.message ||
            errorData?.error ||
            'Errore nella creazione del profilo'
        )
    }

    const newUser = await res.json()
    console.log('✅ User created:', newUser)
    return newUser
}
