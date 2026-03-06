# 03 — Pattern API Routes

> Verità emerse dall'audit del codice reale (Marzo 2026).

## Regole Immutabili per Ogni API Route

Ogni file `app/api/*/route.ts` **DEVE** avere:

```typescript
export const runtime = 'nodejs'           // ← SEMPRE, prima riga
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'

// ← SEMPRE presente per CORS preflight mobile
export async function OPTIONS(req: Request) {
    return handleOptions()
}

// Ogni response DEVE essere wrappata con withCors()
export async function GET(req: Request) {
    const { data, error } = await supabaseServer.from('table').select('*')
    if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    return withCors(NextResponse.json(data))
}
```

## Template Completo API Route

```typescript
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')

        const query = supabaseServer.from('table').select('*').is('deleted_at', null)
        if (userId) query.eq('user_id', userId)

        const { data, error } = await query
        if (error) throw error

        return withCors(NextResponse.json(data))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        // validazione minimale...
        const { data, error } = await supabaseServer.from('table').insert(body).select().single()
        if (error) throw error
        return withCors(NextResponse.json(data, { status: 201 }))
    } catch (error: any) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
```

## Pattern Risposta

```typescript
// Successo — dato diretto (non wrappato in { data: ... })
return withCors(NextResponse.json(data))
return withCors(NextResponse.json(data, { status: 201 }))

// Errore — sempre { error: "messaggio" } con status code
return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }))
return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
```

## supabaseServer vs createServerClient()

```typescript
// supabaseServer — usa SERVICE ROLE KEY, bypassa tutte le RLS
// Usare solo quando necessario (operazioni admin, cross-user)
import { supabaseServer } from '@/lib/supabase-server'

// createServerClient() — usa ANON KEY + cookies, rispetta RLS
// Preferire per operazioni che devono rispettare i permessi utente
import { createServerClient } from '@/lib/supabase-server'
const supabase = await createServerClient()
```

## Sicurezza — Verifica JWT Server-Side (Feb 2026)

Le API route che eseguono **operazioni di scrittura** (POST/PATCH/DELETE) per conto di un utente **devono verificare il JWT server-side** ed evitare di fidarsi ciecamente dello `userId` nel body.

### Funzione `getUserIdFromAuthToken()` — `lib/supabase-server.ts`

```typescript
// Estrae e verifica l'utente autenticato dal JWT in cookies
export async function getUserIdFromAuthToken(req: Request): Promise<string | null> {
    try {
        const client = await createServerClient()
        const { data: { user }, error } = await client.auth.getUser()
        if (error || !user) return null
        return user.id
    } catch {
        return null
    }
}
```

### Pattern da seguire nelle route protette

```typescript
export async function POST(req: Request) {
    const authenticatedUserId = await getUserIdFromAuthToken(req)
    if (!authenticatedUserId)
        return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

    const body = await req.json()
    if (body.senderId !== authenticatedUserId)
        return withCors(NextResponse.json({ error: 'forbidden_sender_mismatch' }, { status: 403 }))

    // ... prosegui con l'operazione
}
```

### Status code di sicurezza standardizzati

| Code | Error key | Significato |
|------|-----------|-------------|
| `401` | `unauthorized` | JWT assente o non valido |
| `403` | `forbidden_sender_mismatch` | senderId ≠ utente autenticato |
| `403` | `forbidden_user_mismatch` | userId ≠ utente autenticato |
| `403` | `forbidden_agent_mismatch` | agentId ≠ utente autenticato |
| `403` | `forbidden_cannot_mark_others_messages` | Tentativo di marcare messaggi altrui |

### Endpoint già hardened (verifica JWT attiva)

- `/api/messages` POST — verifica `senderId`
- `/api/messages` PATCH — verifica `userId` o ownership dei messaggi per IDs
- `/api/affiliations` POST — verifica `agentId`

### Endpoint da hardenare (priorità decrescente)

1. `/api/users` PATCH — verifica che `userId` corrisponda al token
2. `/api/follows` POST/DELETE — verifica `followerId`
3. `/api/notifications` PATCH — verifica `userId`
4. `/api/opportunities` POST — verifica `creatorId`

---

## SSE (Server-Sent Events) — Limitazioni Vercel

L'endpoint `/api/notifications/stream` usa SSE con connessioni persistenti.

**⚠️ PROBLEMA**: Vercel serverless **non supporta** connessioni HTTP persistenti. L'SSE funziona in locale (dev), ma può fallire in produzione su Vercel.

**Regola**: Qualsiasi feature di real-time che si appoggia all'SSE **deve** avere un fallback di polling:

```typescript
// Fallback polling (lato client)
const fallbackPoll = setInterval(async () => {
    const res = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
    const data = await res.json()
    // aggiorna UI...
}, 30_000) // ogni 30 secondi
```

## Lista Endpoint Esistenti (27 routes)

| Endpoint | Note |
|----------|------|
| `/api/users` | GET all / POST create |
| `/api/follows` | Follow/unfollow |
| `/api/opportunities` | Annunci lavoro |
| `/api/applications` | Candidature |
| `/api/needs` | Fabbisogni |
| `/api/affiliations` | Agente ↔ Giocatore |
| `/api/favorites` | Bookmark |
| `/api/verifications` | Endorsement |
| `/api/blocked-agents` | Block list |
| `/api/clubs` | Club CRUD |
| `/api/club-memberships` | Iscrizioni |
| `/api/club-join-requests` | Richieste join |
| `/api/club-join-requests/accept` | Approvazione |
| `/api/notifications` | CRUD notifiche |
| `/api/notifications/stream` | SSE real-time (dev only) |
| `/api/notification-preferences` | Preferenze notifiche |
| `/api/messages` | Chat 1-to-1 |
| `/api/search/athletes` | Ricerca atleti |
| `/api/search/professionals` | Ricerca professionisti |
| `/api/athletes` | Lista atleti |
| `/api/career-experiences` | Storico carriera |
| `/api/physical-stats` | Stats fisiche |
| `/api/match` | Partite/match |
| `/api/upload` | Upload file Supabase Storage |
| `/api/sports-organizations` | Organizzazioni sportive |
| `/api/organization-requests` | Richieste organizzazione |
| `/api/organization-requests/[id]/approve` | Approvazione |
