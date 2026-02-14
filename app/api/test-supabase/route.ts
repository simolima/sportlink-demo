import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-browser'

export async function GET() {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json({
                status: '⚠️ Supabase non configurato',
                error: 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY mancanti',
                env_check: {
                    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                }
            }, { status: 500 })
        }

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
            database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
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
                NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
