import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
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

// Server-side client with user context (respects RLS).
// Uses @supabase/ssr so it reads the session from the cookies set by createBrowserClient.
// setAll is intentionally a no-op: Server Components cannot write cookies at runtime;
// token refresh is handled by middleware.ts.
export async function createServerClient() {
    const cookieStore = await cookies()

    return createSSRClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => { /* no-op: read-only in Server Components */ },
        },
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

/**
 * Estrae e verifica l'utente autenticato dal token JWT nelle cookies di Supabase
 * 
 * ✅ SECURITY: Verifica il token lato server — non si può falsificare
 * Questo è il modo "giusto" per ottenere l'utente autenticato in produzione
 * 
 * Usage in API routes:
 * const authenticatedUserId = await getUserIdFromAuthToken(req)
 * if (!authenticatedUserId) return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
 */
export async function getUserIdFromAuthToken(req: Request): Promise<string | null> {
    try {
        // 1. Try Authorization: Bearer <token> header (primary method)
        const authHeader = req.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            const { data: { user }, error } = await supabaseServer.auth.getUser(token)
            if (!error && user) return user.id
        }

        // 2. Fallback: cookie-based session (for future @supabase/ssr migration)
        const client = await createServerClient()
        const { data: { user }, error } = await client.auth.getUser()
        if (!error && user) return user.id

        console.log('Auth token invalid or expired')
        return null
    } catch (err) {
        console.error('Error verifying auth token:', err)
        return null
    }
}
