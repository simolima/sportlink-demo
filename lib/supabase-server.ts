import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
