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

## Lista Endpoint Esistenti (29 routes)

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
