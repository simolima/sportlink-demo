import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set (server)')
}

// Fallback placeholders to avoid hard crash during build-time module evaluation
const effectiveSupabaseUrl = supabaseUrl || 'http://127.0.0.1:54321'
const effectiveSupabaseAnonKey = supabaseAnonKey || 'public-anon-key-placeholder'

// Server-side client with user context (respects RLS)
export async function createServerClient() {
    const cookieStore = await cookies()

    return createClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey, {
        auth: {
            storageKey: 'sb-auth-token',
            storage: {
                getItem: (key: string) => {
                    return cookieStore.get(key)?.value ?? null
                },
                setItem: (key: string, value: string) => {
                    cookieStore.set(key, value)
                },
                removeItem: (key: string) => {
                    cookieStore.delete(key)
                }
            },
            autoRefreshToken: true,
            persistSession: true
        }
    })
}

// For operations that truly need to bypass RLS (use sparingly!)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - some operations may fail')
}

export const supabaseServer = supabaseServiceKey
    ? createClient(effectiveSupabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : createClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

/**
 * ⚠️ SECURITY VALIDATION
 * Valida che un userId sia un UUID v4 valido.
 * 
 * In produzione con Supabase Auth reale, dovremmo verificare il token JWT
 * al posto di affidarci al body della richiesta.
 * Per ora è una protezione minima contro input non validi.
 */
export function isValidUserId(userId: any): userId is string {
    if (!userId || typeof userId !== 'string') return false
    
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(userId)
}

/**
 * Estrae e valida userId dal body della richiesta.
 * Ritorna un errore NextResponse se invalido, altrimenti ritorna userId.
 * 
 * Usage:
 * const validation = validateUserIdFromBody(body)
 * if (!validation.valid) return withCors(validation.error)
 * const userId = validation.userId
 */
export function validateUserIdFromBody(body: any): { valid: false; error: any } | { valid: true; userId: string } {
    const userId = body?.userId?.toString?.()
    
    if (!userId) {
        return {
            valid: false,
            error: NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
        }
    }
    
    if (!isValidUserId(userId)) {
        return {
            valid: false,
            error: NextResponse.json({ error: 'invalid_user_id_format' }, { status: 400 })
        }
    }
    
    return { valid: true, userId }
}
