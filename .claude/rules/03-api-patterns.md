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

## Client Supabase — Quale Usare

> Per la tabella completa dei 3 client (supabaseServer, createServerClient, browser) → vedi **02-database.md**.

Regola rapida: `supabaseServer` (Service Role Key, bypassa RLS) solo per operazioni admin. Preferire `createServerClient()` (Anon Key + cookies, rispetta RLS) nelle route normali.

## Sicurezza — Verifica JWT Server-Side (Feb 2026)

Le API route che eseguono **operazioni di scrittura** (POST/PATCH/DELETE) per conto di un utente **devono verificare il JWT server-side** ed evitare di fidarsi ciecamente dello `userId` nel body.

### Funzione `getUserIdFromAuthToken()` — `lib/supabase-server.ts`

```typescript
// Estrae e verifica l'utente autenticato dal JWT
// 1. Legge il token dall'header Authorization: Bearer <token> (metodo primario)
// 2. Fallback: tenta session via cookies (per futura migrazione @supabase/ssr)
export async function getUserIdFromAuthToken(req: Request): Promise<string | null> {
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            const { data: { user }, error } = await supabaseServer.auth.getUser(token)
            if (!error && user) return user.id
        }
        // Fallback cookie-based
        const client = await createServerClient()
        const { data: { user }, error } = await client.auth.getUser()
        if (!error && user) return user.id
        return null
    } catch {
        return null
    }
}
```

### Client-side: `getAuthHeaders()` — `lib/auth-fetch.ts`

Il browser Supabase client salva i token in **localStorage** (default), non in cookie.
Per inviare il token al server, usare `getAuthHeaders()` che legge la sessione corrente:

```typescript
import { getAuthHeaders } from '@/lib/auth-fetch'

// GET autenticata
const authHeaders = await getAuthHeaders()
const res = await fetch('/api/resource', { headers: authHeaders })

// POST/PUT/PATCH autenticata
const res = await fetch('/api/resource', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
})
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

### Endpoint hardened (verifica JWT attiva)

- `/api/messages` POST — verifica `senderId`
- `/api/messages` PATCH — verifica `userId` o ownership dei messaggi per IDs
- `/api/affiliations` POST — verifica `agentId`
- `/api/affiliations` PUT — verifica JWT + ownership `player_id` (accept/reject solo dal player autenticato)
- `/api/studios/[id]/reviews` POST — cliente attivo può creare la propria recensione
- `/api/studios/[id]/reviews` POST — cliente attivo **oppure** utente con almeno un appuntamento `completed` nello studio può creare la propria recensione
- `/api/studios/[id]/reviews/[reviewId]` PATCH — autore aggiorna `rating/title/comment` (reset `isVerified=false`), owner modera `isPublished`/`isVerified` e può gestire `ownerResponse`
- `/api/users/roles` POST — creazione ruolo multi-profile autenticata (usa `authenticatedUserId` dal token)
- `/api/users` PATCH — verifica che `userId` corrisponda al token
- `/api/follows` POST/DELETE — verifica `followerId`
- `/api/notifications` PUT — verifica `userId`
- `/api/opportunities` POST — verifica `creatorId`
- `/api/studios` POST — verifica ruolo medico su `profile_roles` (fallback `profiles.role_id`)
- `/api/clubs` POST — verifica ruolo `sporting_director` su `profile_roles` (fallback `profiles.role_id`)

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

## Timezone Booking Studio (Marzo 2026)

Per gli endpoint studio booking/calendar, il timezone source-of-truth è `professional_studios.timezone` (fallback `Europe/Rome`).

Regole:
- In POST/PATCH appuntamenti, normalizzare `startTime/endTime` in UTC **dopo** aver interpretato input naive nel timezone studio.
- In validazione slot (`available-slots`/booking engine), usare day boundaries timezone-aware; evitare range hardcoded `T00:00:00Z` / `T23:59:59Z` non contestualizzati.
- In estrazione orari (`HH:MM`) per conflict detection, evitare `new Date(...).toISOString().substring(...)`.
- Nel sync con Google Calendar, passare `timeZone` esplicito nel payload eventi per evitare interpretazioni implicite.

## Lista Endpoint Esistenti (35+ routes)

### `/api/club-memberships` — Role Scope (Marzo 2026)

- GET supporta il filtro `professionalRoleId`:
    - `/api/club-memberships?userId=<uuid>&professionalRoleId=coach`
- La risposta include `professionalRoleId` (camelCase) derivato da `professional_role_id`.
- In POST/flow di creazione membership (`/api/clubs`, `/api/club-join-requests/accept`) il backend valorizza sempre `professional_role_id` per evitare leakage cross-profilo.

| Endpoint | Note |
|----------|------|
| `/api/users` | GET all / POST create / PATCH update |
| `/api/users/roles` | Lista ruoli utente + creazione ruolo multi-profile (POST autenticata) + rimozione ruolo sicura (DELETE autenticata, disattiva solo il ruolo target) |
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
| `/api/notifications` | CRUD notifiche (GET/POST/PUT/DELETE) |
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
| `/api/lookup/positions` | Lookup posizioni per sport+ruolo (supporta alias Pallavolo/Volley) |
| `/api/studios/[id]/appointment-types` | Catalogo servizi studio (GET/POST) |
| `/api/studios/[id]/appointment-types/[typeId]` | Servizio singolo (PATCH/DELETE) |
| `/api/studios/[id]/availability` | Regole disponibilità settimanali (GET/POST) |
| `/api/studios/[id]/available-slots` | Slot prenotabili per servizio+data (GET, supporta ricerca multi-giorno) |
| `/api/studios/[id]/appointments` | Appuntamenti studio (GET/POST) |
| `/api/studios/[id]/appointments/[apptId]` | Appuntamento singolo (PATCH/DELETE) |
| `/api/studios/[id]/specializations` | Specializzazioni studio (GET/POST) — GET pubblico, POST owner-only |
| `/api/studios/[id]/specializations/[specId]` | Specializzazione singola (PATCH/DELETE owner-only) |
| `/api/studios/[id]/faqs` | FAQ studio (GET/POST) — GET pubblico, POST owner-only |
| `/api/studios/[id]/faqs/[faqId]` | FAQ singola (PATCH/DELETE owner-only) |
| `/api/studios/[id]/reviews` | Recensioni studio (GET pubblico, POST client attivo) |
| `/api/studios/[id]/reviews/[reviewId]` | Recensione singola (PATCH owner moderazione, DELETE owner) |
| `/api/studios/[id]/clients` | Lista clienti studio (GET owner-only) — usata per permission validation recensioni |
| `/api/studios/[id]/google-calendar` | Stato connessione + selezione calendario + disconnect |
| `/api/studios/[id]/google-auth/initiate` | Avvio OAuth Google Calendar |
| `/api/studios/[id]/google-auth/callback` | Callback OAuth Google Calendar |
| `/api/studios/[id]/google-calendars` | Lista calendari Google disponibili |
| `/api/studios/[id]/sync-google` | Sync manuale Google Calendar -> cache eventi esterni |
| `/api/studios/[id]/calendar-events` | Feed eventi aggregato (appointments + external events) |
| `/api/studios/[id]/external-blockers` | Creazione blocchi orari manuali (occupato personale) |
| `/api/studios/[id]/reviews` | Recensioni studio (GET/POST) |
| `/api/studios/[id]/reviews/[reviewId]` | Recensione singola (PATCH/DELETE) |
| `/api/messages/[id]/reactions` | Toggle reazione su messaggio 1:1 (POST) — tipi: like/love/fire/trophy/zap/star |
| `/api/groups` | Lista gruppi utente (GET) + crea gruppo (POST) |
| `/api/groups/[id]` | Info gruppo + membri (GET), aggiorna nome/avatar (PATCH admin), soft-delete (DELETE admin) |
| `/api/groups/[id]/messages` | Messaggi gruppo (GET → `{ messages, firstUnreadMessageId }`), invia (POST) |
| `/api/groups/[id]/messages/[msgId]` | Modifica testo (PATCH 15-min window), elimina per tutti/solo me (PATCH scope) |
| `/api/groups/[id]/messages/[msgId]/reactions` | Toggle reazione su messaggio di gruppo (POST) |
| `/api/groups/[id]/members` | Lista membri (GET), aggiungi (POST admin), promuovi/declassa (PATCH admin), rimuovi/esci (DELETE) |
| `/api/groups/[id]/reads` | Batch mark-as-read (POST `{ messageIds[] }`) — upsert in `group_message_reads` |
