# Security Authentication Hardening - Feb 21, 2026

## Overview
Critical security update to verify JWT authentication tokens server-side in API routes. Previously, API endpoints trusted `userId` from client request bodies without verification, allowing potential impersonation attacks.

---

## Changes Implemented

### 1. New Authentication Function (`lib/supabase-server.ts`)

Added `getUserIdFromAuthToken()` function to extract and verify authenticated user from JWT token:

```typescript
export async function getUserIdFromAuthToken(req: Request): Promise<string | null> {
    try {
        const client = await createServerClient()
        const { data: { user }, error } = await client.auth.getUser()
        
        if (error || !user) {
            console.log('Auth token invalid or expired:', error?.message)
            return null
        }
        
        return user.id
    } catch (err) {
        console.error('Error verifying auth token:', err)
        return null
    }
}
```

**Key Features:**
- Reads JWT from cookies via `createServerClient()`
- Verifies token signature and expiry server-side
- Returns actual authenticated userId or `null` if invalid
- Cannot be faked by client

---

## Updated API Endpoints

### `/api/messages` - POST (Send Message)

**Before:** Trusted `senderId` from request body  
**After:** 
1. Verifies JWT token → extracts `authenticatedUserId`
2. Returns `401 Unauthorized` if no valid token
3. Compares `body.senderId` with `authenticatedUserId`
4. Returns `403 Forbidden (forbidden_sender_mismatch)` if mismatch

**Security Impact:** Prevents user A from sending messages as user B

---

### `/api/messages` - PATCH (Mark as Read)

**Before:** Trusted `userId` from request body  
**After:** 

**For `{ userId, peerId }` request:**
1. Verifies JWT token
2. Returns `401 Unauthorized` if no valid token
3. Compares `body.userId` with `authenticatedUserId`
4. Returns `403 Forbidden (forbidden_user_mismatch)` if mismatch

**For `{ ids: [...] }` request:**
1. Verifies JWT token
2. Fetches all messages by IDs from database
3. Checks that all messages have `receiver_id === authenticatedUserId`
4. Returns `403 Forbidden (forbidden_cannot_mark_others_messages)` if any message doesn't belong to user

**Security Impact:** Prevents users from marking other users' messages as read

---

### `/api/affiliations` - POST (Create Affiliation Request)

**Before:** Trusted `agentId` from request body  
**After:**
1. Verifies JWT token → extracts `authenticatedUserId`
2. Returns `401 Unauthorized` if no valid token
3. Compares `body.agentId` with `authenticatedUserId`
4. Returns `403 Forbidden (forbidden_agent_mismatch)` if mismatch

**Security Impact:** Ensures agents can only create affiliation requests on their own behalf

---

## HTTP Status Codes

| Code | Error | Meaning |
|------|-------|---------|
| `401` | `unauthorized` | No valid JWT token provided |
| `403` | `forbidden_sender_mismatch` | senderId doesn't match authenticated user |
| `403` | `forbidden_user_mismatch` | userId doesn't match authenticated user |
| `403` | `forbidden_agent_mismatch` | agentId doesn't match authenticated user |
| `403` | `forbidden_cannot_mark_others_messages` | Attempted to mark messages not addressed to user |

---

## Security Model

### Authentication Flow
```
Client Request → API Route
  ↓
  Extract JWT from cookies (createServerClient)
  ↓
  Verify signature + expiry (auth.getUser())
  ↓
  Extract user.id → authenticatedUserId
  ↓
  Compare with userId in request body
  ↓
  Allow operation ONLY if match
```

### UUID Validation (Still Active)
- `validateUserIdFromBody()` validates UUID format
- Prevents SQL injection via malformed UUIDs
- Acts as secondary defense layer

---

## Breaking Changes

### Client-Side Requirements

**Before:**
```typescript
fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ senderId, receiverId, text })
})
```

**After:** 
```typescript
// MUST have valid Supabase session with auth token in cookies
const { data: { session } } = await supabaseBrowser.auth.getSession()
if (!session) {
    // Redirect to login
    return
}

fetch('/api/messages', {
    method: 'POST',
    credentials: 'include',  // ✅ Send cookies with request
    body: JSON.stringify({ senderId, receiverId, text })
})
```

**Critical:** All protected endpoints now require:
1. Valid Supabase session (logged in)
2. Cookies sent with request (`credentials: 'include'`)
3. UserId in body must match authenticated user

---

## Testing Checklist

### Messages Endpoint
- [ ] POST with valid auth + matching senderId → ✅ Success
- [ ] POST with valid auth + wrong senderId → ❌ 403 Forbidden
- [ ] POST without auth token → ❌ 401 Unauthorized
- [ ] PATCH with valid auth + matching userId → ✅ Success
- [ ] PATCH with valid auth + wrong userId → ❌ 403 Forbidden
- [ ] PATCH with ids[] of other user's messages → ❌ 403 Forbidden

### Affiliations Endpoint
- [ ] POST with valid auth + matching agentId → ✅ Success
- [ ] POST with valid auth + wrong agentId → ❌ 403 Forbidden
- [ ] POST without auth token → ❌ 401 Unauthorized

---

## Deployment Notes

### Vercel Environment Variables
Ensure these are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Supabase Cookies
- JWT stored in `sb-xxx-auth-token` cookie (HttpOnly)
- Managed by `@supabase/ssr` `createServerClient()`
- Cookie lifespan controlled by Supabase Auth settings (default: 1 hour access token, 7 days refresh token)

---

## Future Work

### Additional Endpoints to Harden (Priority Order)
1. **`/api/users` PATCH** - Profile updates (verify userId matches auth token)
2. **`/api/follows` POST/DELETE** - Follow actions (verify followerId)
3. **`/api/notifications` PATCH** - Mark notifications read (verify userId)
4. **`/api/opportunities` POST** - Create opportunities (verify creatorId)
5. **`/api/applications` POST** - Apply to opportunities (verify applicantId)

### Admin Endpoints
Consider implementing role-based checks:
```typescript
const user = await getUserFromAuthToken(req)
if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'admin_only' }, { status: 403 })
}
```

### Rate Limiting
Add per-user rate limiting to prevent abuse:
- Upstash Redis for distributed rate limiting
- Vercel Edge Middleware for early request blocking

---

## Commit Message
```
security: verify JWT auth tokens in protected endpoints (CRITICAL)

- Add getUserIdFromAuthToken() to extract+verify authenticated user
- Update /api/messages POST: verify senderId matches auth token
- Update /api/messages PATCH: verify userId/receiver_id matches auth token
- Update /api/affiliations POST: verify agentId matches auth token
- Return 401 Unauthorized if no valid token
- Return 403 Forbidden if userId mismatch
- Prevents user impersonation attacks

Affected endpoints:
  - POST /api/messages → senderId verification
  - PATCH /api/messages → userId/receiver_id verification
  - POST /api/affiliations → agentId verification

Breaking change: All endpoints now require valid Supabase session
```

---

## References
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- @supabase/ssr Package: https://supabase.com/docs/guides/auth/server-side/nextjs
- JWT Best Practices: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
