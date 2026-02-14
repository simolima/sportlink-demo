import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side client with user context (respects RLS)
export async function createServerClient() {
    const cookieStore = await cookies()

    return createClient(supabaseUrl, supabaseAnonKey, {
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
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
