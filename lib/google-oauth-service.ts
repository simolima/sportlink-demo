/**
 * Google OAuth Service
 * 
 * Handles OAuth 2.0 flow, token management, and AES-256-GCM encryption/decryption
 * for Google Calendar API integration.
 * 
 * Security: Tokens are encrypted before storage using AES-256-GCM with key from env var.
 */

import crypto from 'crypto'
import { google } from 'googleapis'

// ============================================================================
// TYPES
// ============================================================================

export interface OAuthTokens {
    access_token: string
    refresh_token: string
    expiry_date: number // Unix timestamp in milliseconds
    scope: string
    token_type: string
}

export interface EncryptedTokenPair {
    encryptedAccessToken: string
    encryptedRefreshToken: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
// Must be static URI (no dynamic [id] segments) - Google OAuth requirement
// Example: https://sportlink-demo-ejj2.vercel.app/api/google-auth/callback
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI
const GOOGLE_TOKEN_ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY // 64-char hex string

/**
 * Lazy validation of OAuth environment variables.
 * Only throws at runtime when functions are actually called, not at module load.
 * This allows the module to be imported during build without failing CI.
 */
function validateOAuthConfig() {
    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
        throw new Error('Missing required Google OAuth environment variables')
    }
}

/**
 * Lazy validation of encryption key.
 * Only throws at runtime when encryption functions are called.
 */
function validateEncryptionKey(): Buffer {
    if (!GOOGLE_TOKEN_ENCRYPTION_KEY || GOOGLE_TOKEN_ENCRYPTION_KEY.length !== 64) {
        throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
    }
    return Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY, 'hex')
}

// OAuth 2.0 scopes
const CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events', // Full read/write for events
]

// ============================================================================
// OAUTH CLIENT FACTORY
// ============================================================================

/**
 * Create OAuth2 client instance
 */
function createOAuth2Client() {
    validateOAuthConfig()
    return new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
    )
}

// ============================================================================
// OAUTH FLOW FUNCTIONS
// ============================================================================

/**
 * Generate OAuth authorization URL for user consent flow
 * 
 * @param professionalStudioId - Studio ID for state parameter (CSRF protection)
 * @returns Authorization URL to redirect user to
 */
export function generateAuthUrl(professionalStudioId: string): string {
    const oauth2Client = createOAuth2Client()

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: CALENDAR_SCOPES,
        state: professionalStudioId, // CSRF protection - will be echoed back in callback
        prompt: 'consent', // Force consent screen to ensure refresh token is returned
    })

    return authUrl
}

/**
 * Exchange authorization code for access and refresh tokens
 * 
 * @param code - Authorization code from OAuth callback
 * @returns Token pair with access token, refresh token, and expiry
 * @throws Error if token exchange fails
 */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const oauth2Client = createOAuth2Client()

    try {
        const { tokens } = await oauth2Client.getToken(code)

        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Missing access_token or refresh_token in response')
        }

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000, // Default 1 hour
            scope: tokens.scope || CALENDAR_SCOPES.join(' '),
            token_type: tokens.token_type || 'Bearer',
        }
    } catch (error: any) {
        throw new Error(`Token exchange failed: ${error.message}`)
    }
}

/**
 * Refresh expired access token using refresh token
 * 
 * @param refreshToken - Refresh token (decrypted)
 * @returns New access token and expiry date
 * @throws Error if refresh fails
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    expiry_date: number
}> {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    try {
        const { credentials } = await oauth2Client.refreshAccessToken()

        if (!credentials.access_token) {
            throw new Error('No access_token returned from refresh')
        }

        return {
            access_token: credentials.access_token,
            expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
        }
    } catch (error: any) {
        throw new Error(`Token refresh failed: ${error.message}`)
    }
}

/**
 * Revoke Google OAuth access (user disconnect)
 * 
 * @param refreshToken - Refresh token to revoke (decrypted)
 * @throws Error if revocation fails
 */
export async function revokeAccess(refreshToken: string): Promise<void> {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    try {
        await oauth2Client.revokeCredentials()
    } catch (error: any) {
        // Log error but don't throw - allow disconnect even if revocation fails
        console.error('Token revocation failed (allowing disconnect):', error.message)
    }
}

// ============================================================================
// ENCRYPTION FUNCTIONS (AES-256-GCM)
// ============================================================================

/**
 * Encrypt token using AES-256-GCM
 * 
 * Format: iv:authTag:encryptedData (all hex-encoded)
 * 
 * @param token - Plain text token to encrypt
 * @returns Encrypted token string (format: iv:authTag:encryptedData)
 */
export function encryptToken(token: string): string {
    const encryptionKey = validateEncryptionKey()

    // Generate random 12-byte IV (recommended for GCM)
    const iv = crypto.randomBytes(12)

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv)

    // Encrypt token
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag (16 bytes for GCM)
    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encryptedData (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt token using AES-256-GCM
 * 
 * @param encryptedToken - Encrypted token string (format: iv:authTag:encryptedData)
 * @returns Decrypted plain text token
 * @throws Error if decryption fails (wrong key, tampered data, invalid format)
 */
export function decryptToken(encryptedToken: string): string {
    const encryptionKey = validateEncryptionKey()

    try {
        // Parse format: iv:authTag:encryptedData
        const parts = encryptedToken.split(':')
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted token format (expected iv:authTag:encryptedData)')
        }

        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]

        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv)
        decipher.setAuthTag(authTag)

        // Decrypt token
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error: any) {
        throw new Error(`Token decryption failed: ${error.message}`)
    }
}

/**
 * Encrypt both access and refresh tokens
 * 
 * @param tokens - Token pair to encrypt
 * @returns Encrypted token pair
 */
export function encryptTokenPair(tokens: OAuthTokens): EncryptedTokenPair {
    return {
        encryptedAccessToken: encryptToken(tokens.access_token),
        encryptedRefreshToken: encryptToken(tokens.refresh_token),
    }
}

/**
 * Check if access token is expired or will expire soon
 * 
 * @param expiryDate - Token expiry date (Unix timestamp in milliseconds)
 * @param bufferSeconds - Safety buffer in seconds (default 300 = 5 minutes)
 * @returns true if token is expired or will expire within buffer period
 */
export function isTokenExpired(expiryDate: number, bufferSeconds: number = 300): boolean {
    const now = Date.now()
    const expiryWithBuffer = expiryDate - bufferSeconds * 1000
    return now >= expiryWithBuffer
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate OAuth callback contains required parameters
 * 
 * @param code - Authorization code
 * @param error - Error parameter (if OAuth failed)
 * @throws Error if validation fails
 */
export function validateCallbackParams(code: string | null, error: string | null): void {
    if (error) {
        throw new Error(`OAuth authorization failed: ${error}`)
    }
    if (!code) {
        throw new Error('Missing authorization code in callback')
    }
}
