import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabase } from '@/lib/supabase-browser'

export const runtime = 'nodejs'

// Helper: Mappa i ruoli frontend (es: "Player") ai ruoli database (es: "player")
function mapRoleToDatabase(frontendRole: string): string {
    const roleMap: Record<string, string> = {
        'Player': 'player',
        'Coach': 'coach',
        'Agent': 'agent',
        'Sporting Director': 'sporting_director',
        'Athletic Trainer': 'athletic_trainer',
        'Nutritionist': 'nutritionist',
        'Physio/Masseur': 'physio',
        'Talent Scout': 'talent_scout'
    }
    return roleMap[frontendRole] || frontendRole.toLowerCase().replace(/\s+/g, '_')
}

// Handle preflight requests
export async function OPTIONS(req: Request) {
    return handleOptions()
}

// GET /api/users - Get all profiles
export async function GET(req: Request) {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase GET error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(profiles || []))
    } catch (err: any) {
        console.error('GET /api/users error:', err)
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// POST /api/users - Create new profile (signup)
export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Validation: require email and password
        const email = (body.email || '').toString().trim().toLowerCase()
        const password = body.password || ''

        if (!email) {
            return withCors(NextResponse.json({ error: 'email_required' }, { status: 400 }))
        }

        if (!password || password.length < 6) {
            return withCors(NextResponse.json({ error: 'password_too_short' }, { status: 400 }))
        }

        // Step 1: Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: body.firstName ?? '',
                    last_name: body.lastName ?? '',
                }
            }
        })

        if (authError) {
            console.error('Supabase Auth error:', authError)
            if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
                return withCors(NextResponse.json({ error: 'email_exists' }, { status: 409 }))
            }
            if (authError.code === 'email_address_invalid') {
                return withCors(NextResponse.json({
                    error: 'email_invalid',
                    message: 'Email non valida. Usa un formato valido (es: nome.cognome@domain.com)'
                }, { status: 400 }))
            }
            return withCors(NextResponse.json({
                error: authError.code || 'auth_error',
                message: authError.message
            }, { status: 500 }))
        }

        if (!authData.user) {
            return withCors(NextResponse.json({ error: 'signup_failed' }, { status: 500 }))
        }

        // Capture user id/email now to avoid 'possibly null' after awaits
        const userId = authData.user.id
        const userEmail = authData.user.email

        // Step 2: Update profile in profiles table (creato automaticamente da trigger)
        // Aspetta un attimo per il trigger
        await new Promise(resolve => setTimeout(resolve, 500))

        // Mappa il ruolo frontend al formato database
        const roleId = body.professionalRole
            ? mapRoleToDatabase(body.professionalRole)
            : (body.roleId ? mapRoleToDatabase(body.roleId) : null)

        const profileUpdates = {
            username: body.username ?? null,
            gender: body.gender ?? null,
            phone_number: body.phoneNumber ?? null,
            role_id: roleId,
            bio: body.bio ?? '',
            avatar_url: body.avatarUrl ?? null,
            cover_url: body.coverUrl ?? null,
            city: body.city ?? '',
            country: body.country ?? '',
            birth_date: body.birthDate ?? null,
            privacy_settings: body.privacySettings ?? null,
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
            .select()
            .single()

        if (profileError) {
            console.error('Profile update error:', profileError)
            // Non blocchiamo se l'update fallisce, l'utente auth è stato creato
        }

        // Step 3: Insert sports in profile_sports (if provided)
        console.log('🔍 Step 3: Checking sports data')
        console.log('body.sports:', body.sports)
        console.log('Is array?', Array.isArray(body.sports))
        console.log('Length:', body.sports?.length)

        if (body.sports && Array.isArray(body.sports) && body.sports.length > 0) {
            console.log('✅ Sports validation passed, querying lookup_sports...')

            // Prima ottieni gli ID degli sport da lookup_sports
            const { data: sportsData, error: sportsError } = await supabase
                .from('lookup_sports')
                .select('id, name')
                .in('name', body.sports)

            console.log('📊 lookup_sports query result:', { sportsData, sportsError })

            if (!sportsError && sportsData && sportsData.length > 0) {
                console.log('✅ Found sports in lookup table, creating profile_sports records...')

                // Crea i record in profile_sports
                const profileSportsRecords = sportsData.map((sport, index) => ({
                    user_id: userId,
                    sport_id: sport.id,
                    is_main_sport: index === 0, // Il primo è lo sport principale
                }))

                console.log('📝 Records to insert:', profileSportsRecords)

                const { error: insertSportsError } = await supabase
                    .from('profile_sports')
                    .insert(profileSportsRecords)

                console.log('💾 Insert result:', { insertSportsError })

                if (insertSportsError) {
                    console.error('❌ Profile sports insert error:', insertSportsError)
                    // Non blocchiamo, l'utente è stato creato
                } else {
                    console.log('✅ Profile sports inserted successfully!')
                }
            } else {
                console.warn('⚠️ No sports found in lookup_sports or query error:', sportsError)
            }
        } else {
            console.log('⏭️ Skipping sports insertion - no sports provided or invalid format')
        }

        return withCors(NextResponse.json({
            id: userId,
            email: userEmail,
            firstName: body.firstName,
            lastName: body.lastName,
            professionalRole: body.professionalRole,
            ...profile
        }))

    } catch (err: any) {
        console.error('POST /api/users error:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}

// PATCH /api/users - Update existing profile
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const id = body.id ?? null

        if (!id) {
            return withCors(NextResponse.json({ error: 'id_required' }, { status: 400 }))
        }

        // Check if profile exists
        const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single()

        if (!existing) {
            return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }))
        }

        // Prepare update data (only include fields that are provided)
        const updates: any = {
            updated_at: new Date().toISOString()
        }

        // Map frontend camelCase → database snake_case (SOLO campi esistenti)
        if (body.firstName !== undefined) updates.first_name = body.firstName
        if (body.lastName !== undefined) updates.last_name = body.lastName
        if (body.username !== undefined) updates.username = body.username
        if (body.email !== undefined) updates.email = body.email
        if (body.gender !== undefined) updates.gender = body.gender
        if (body.phoneNumber !== undefined) updates.phone_number = body.phoneNumber
        if (body.professionalRole !== undefined) updates.role_id = body.professionalRole
        if (body.roleId !== undefined) updates.role_id = body.roleId
        if (body.bio !== undefined) updates.bio = body.bio
        if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl
        if (body.coverUrl !== undefined) updates.cover_url = body.coverUrl
        if (body.city !== undefined) updates.city = body.city
        if (body.country !== undefined) updates.country = body.country
        if (body.birthDate !== undefined) updates.birth_date = body.birthDate
        if (body.latitude !== undefined) updates.latitude = body.latitude
        if (body.longitude !== undefined) updates.longitude = body.longitude
        if (body.privacySettings !== undefined) updates.privacy_settings = body.privacySettings
        if (body.verified !== undefined) updates.is_verified = body.verified

        // Update in Supabase
        const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Supabase UPDATE error:', updateError)
            return withCors(NextResponse.json({ error: updateError.message }, { status: 500 }))
        }

        return withCors(NextResponse.json(updated))

    } catch (err: any) {
        console.error('PATCH /api/users error:', err)
        return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
    }
}
