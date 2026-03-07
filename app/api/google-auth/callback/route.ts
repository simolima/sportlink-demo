/**
 * API Route: Google Calendar OAuth Callback (Static URI)
 * 
 * GET /api/google-auth/callback?code=...&state=...
 * 
 * Static callback endpoint for Google OAuth (required by Google Cloud Console).
 * Studio ID is passed via state parameter, not URL path.
 * 
 * Flow:
 * 1. Validates state parameter (CSRF protection)
 * 2. Exchanges authorization code for tokens
 * 3. Encrypts tokens using AES-256-GCM
 * 4. Saves encrypted tokens to database
 * 5. Redirects to studio dashboard calendar page
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import {
    exchangeCodeForTokens,
    encryptTokenPair,
    validateCallbackParams,
} from '@/lib/google-oauth-service'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state') // Contains studio ID
        const error = url.searchParams.get('error')

        // 1. Validate callback parameters
        validateCallbackParams(code, error)

        if (!state) {
            return NextResponse.redirect(
                new URL('/dashboard?error=missing_state', req.url)
            )
        }

        // State parameter contains studio ID (set in initiate endpoint)
        const studioId = state

        // 2. Verify studio exists
        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('id, owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            console.error(`Studio not found: ${studioId}`, studioError)
            return NextResponse.redirect(
                new URL('/dashboard?error=studio_not_found', req.url)
            )
        }

        // 3. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code!)

        // 4. Encrypt tokens
        const { encryptedAccessToken, encryptedRefreshToken } = encryptTokenPair(tokens)

        // 5. Check if connection already exists (upsert logic)
        const { data: existingConnection } = await supabaseServer
            .from('google_calendar_connections')
            .select('id')
            .eq('professional_studio_id', studioId)
            .is('deleted_at', null)
            .single()

        let connection
        if (existingConnection) {
            // Update existing connection
            const { data, error: updateError } = await supabaseServer
                .from('google_calendar_connections')
                .update({
                    encrypted_access_token: encryptedAccessToken,
                    encrypted_refresh_token: encryptedRefreshToken,
                    token_expires_at: new Date(tokens.expiry_date).toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingConnection.id)
                .select()
                .single()

            if (updateError) {
                console.error('Failed to update Google Calendar connection:', updateError)
                return NextResponse.redirect(
                    new URL(`/studios/${studioId}/dashboard?error=connection_update_failed`, req.url)
                )
            }
            connection = data
        } else {
            // Insert new connection
            const { data, error: insertError } = await supabaseServer
                .from('google_calendar_connections')
                .insert({
                    professional_studio_id: studioId,
                    encrypted_access_token: encryptedAccessToken,
                    encrypted_refresh_token: encryptedRefreshToken,
                    token_expires_at: new Date(tokens.expiry_date).toISOString(),
                })
                .select()
                .single()

            if (insertError) {
                console.error('Failed to save Google Calendar connection:', insertError)
                return NextResponse.redirect(
                    new URL(`/studios/${studioId}/dashboard?error=connection_save_failed`, req.url)
                )
            }
            connection = data
        }

        console.log(`✅ Google Calendar connected for studio ${studioId}`)

        // 6. Redirect to dashboard calendar page with success flag
        return NextResponse.redirect(
            new URL(`/studios/${studioId}/dashboard/calendar?connected=true`, req.url)
        )
    } catch (error: any) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(
            new URL(`/dashboard?error=oauth_callback_failed&message=${encodeURIComponent(error.message)}`, req.url)
        )
    }
}
