/**
 * API Route: Google Calendar OAuth Callback
 * 
 * GET /api/studios/[id]/google-auth/callback?code=...&state=...
 * 
 * Handles OAuth callback from Google:
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

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const studioId = params.id
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        // 1. Validate callback parameters
        validateCallbackParams(code, error)
        if (!state || state !== studioId) {
            throw new Error('invalid_state_parameter')
        }

        // 2. Verify studio exists
        const { data: studio, error: studioError } = await supabaseServer
            .from('professional_studios')
            .select('id, owner_id')
            .eq('id', studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return NextResponse.redirect(
                new URL(`/studios/${studioId}/dashboard?error=studio_not_found`, req.url)
            )
        }

        // 3. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code!)

        // 4. Encrypt tokens
        const { encryptedAccessToken, encryptedRefreshToken } = encryptTokenPair(tokens)

        // 5. Save connection to database
        const { data: connection, error: dbError } = await supabaseServer
            .from('google_calendar_connections')
            .insert({
                professional_studio_id: studioId,
                encrypted_access_token: encryptedAccessToken,
                encrypted_refresh_token: encryptedRefreshToken,
                token_expires_at: new Date(tokens.expiry_date).toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            console.error('Failed to save Google Calendar connection:', dbError)
            return NextResponse.redirect(
                new URL(`/studios/${studioId}/dashboard?error=connection_save_failed`, req.url)
            )
        }

        console.log(`✅ Google Calendar connected for studio ${studioId}`)

        // 6. Redirect to dashboard calendar page (success)
        return NextResponse.redirect(
            new URL(`/studios/${studioId}/dashboard/calendar?connected=true`, req.url)
        )
    } catch (error: any) {
        console.error('OAuth callback error:', error)

        // Redirect with error message
        const studioId = params.id
        const errorMessage = encodeURIComponent(error.message || 'oauth_failed')
        return NextResponse.redirect(
            new URL(`/studios/${studioId}/dashboard?error=${errorMessage}`, req.url)
        )
    }
}
