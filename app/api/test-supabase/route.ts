import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-browser'

function decodeJwtPayload(token: string): any | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        const json = Buffer.from(padded, 'base64').toString('utf8')
        return JSON.parse(json)
    } catch {
        return null
    }
}

function getProjectRefFromUrl(url?: string): string | null {
    if (!url) return null
    try {
        const host = new URL(url).hostname
        return host.split('.')[0] || null
    } catch {
        return null
    }
}

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({
                status: '⚠️ Supabase non configurato',
                error: 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY mancanti',
                env_check: {
                    NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
                }
            }, { status: 500 })
        }

        const urlRef = getProjectRefFromUrl(supabaseUrl)
        const jwtPayload = decodeJwtPayload(supabaseAnonKey)
        const keyRef = jwtPayload?.ref ?? null
        const keyRole = jwtPayload?.role ?? null
        const refMatches = !!(urlRef && keyRef && urlRef === keyRef)

        // Auth endpoint sanity check: invalid key returns 401 here
        const authHealth = await fetch(`${supabaseUrl}/auth/v1/settings`, {
            method: 'GET',
            headers: {
                apikey: supabaseAnonKey,
            },
            cache: 'no-store',
        })

        // Test 1: Verifica connessione
        const { data: connection, error: connError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)

        if (connError) {
            return NextResponse.json({
                status: '❌ Errore connessione',
                error: connError.message,
                details: connError
            }, { status: 500 })
        }

        // Test 2: Conta profili
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // Test 3: Conta clubs
        const { count: clubsCount, error: clubsError } = await supabase
            .from('clubs')
            .select('*', { count: 'exact', head: true })

        // Test 4: Conta sports_organizations
        const { count: orgsCount, error: orgsError } = await supabase
            .from('sports_organizations')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            status: '✅ Supabase connesso!',
            database_url: supabaseUrl,
            key_diagnostics: {
                key_present: !!supabaseAnonKey,
                key_length: supabaseAnonKey.length,
                key_prefix: `${supabaseAnonKey.slice(0, 16)}...`,
                key_format: jwtPayload ? 'jwt-legacy' : (supabaseAnonKey.startsWith('sb_publishable_') ? 'publishable' : 'unknown'),
                key_role: keyRole,
                url_project_ref: urlRef,
                key_project_ref: keyRef,
                url_key_ref_match: refMatches,
                auth_settings_status: authHealth.status,
                auth_settings_ok: authHealth.ok,
            },
            tables: {
                profiles: {
                    count: count || 0,
                    error: countError?.message || null
                },
                clubs: {
                    count: clubsCount || 0,
                    error: clubsError?.message || null
                },
                sports_organizations: {
                    count: orgsCount || 0,
                    error: orgsError?.message || null
                }
            },
            env_check: {
                NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
            }
        })

    } catch (error: any) {
        return NextResponse.json({
            status: '❌ Errore generale',
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
