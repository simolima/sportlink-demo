# 02 — Database & Supabase

> Verità emerse dall'audit del codice reale (Marzo 2026).

## Client Supabase — Quale Usare

| Client | File | Chiave | Bypassa RLS? | Quando usare |
|--------|------|--------|--------------|--------------|
| `supabaseServer` | `lib/supabase-server.ts` | Service Role Key (se configurata) | ✅ SÌ | API routes admin, operazioni che richiedono pieno accesso |
| `createServerClient()` | `lib/supabase-server.ts` | Anon Key + cookies | ❌ NO | Server Components, API routes che rispettano i permessi utente |
| `supabase` | `lib/supabase-browser.ts` | Anon Key | ❌ NO | Componenti client-side |

**Regola**: Usare `supabaseServer` con parsimonia. Preferire `createServerClient()` nei Server Components e nelle API routes normali se le RLS policies sono configurate correttamente.

**Come funziona il ciclo cookie (Marzo 2026):**
1. **Browser**: `createBrowserClient` (da `@supabase/ssr`) scrive la sessione su `document.cookie` dopo il login
2. **Middleware** (`middleware.ts`): legge il cookie, chiama `getUser()` per validare/refreshare il token, riscrive il cookie aggiornato nella response
3. **Server Component**: `createServerClient()` legge il cookie via `getAll()` e può verificare la sessione senza chiamate di rete extra (`getSession()`)

## snake_case ↔ camelCase — Mapping Manuale

Supabase restituisce i dati in **snake_case**. Il frontend si aspetta **camelCase**. La conversione è **manuale** — non automatica.

```typescript
// ⚠️ Supabase ritorna:
{ follower_id: "...", followed_id: "...", created_at: "..." }

// ✅ Normalizza nella API route prima di restituire:
return withCors(NextResponse.json({
    followerId: data.follower_id,
    followingId: data.followed_id,
    createdAt: data.created_at,
}))
```

Applica questa normalizzazione **sempre** nelle API routes, non nei componenti frontend.

## Ruoli Utente — Mapping

Il database usa sempre **lowercase** per i ruoli. Il campo si chiama `role_id` (FK → `lookup_roles`), **non** `professional_role`:

| DB `role_id` | Label | Frontend |
|--------------|-------|----------|
| `"player"` | Giocatore | `"Player"` o `"player"` |
| `"coach"` | Allenatore | `"Coach"` o `"coach"` |
| `"agent"` | Agente | `"Agent"` o `"agent"` |
| `"sporting_director"` | Direttore Sportivo | varia |
| `"athletic_trainer"` | Preparatore Atletico | varia |
| `"nutritionist"` | Nutrizionista | varia |
| `"physio"` | Fisioterapista | varia |
| `"talent_scout"` | Talent Scout | varia |

**Regola**: Normalizzare sempre con `.toLowerCase()` quando si confrontano ruoli. Non fare assunzioni sulla capitalizzazione.

## Soft Delete

Alcune tabelle hanno il campo `deleted_at`. **Aggiungere sempre** il filtro nelle query:

```typescript
// ✅ CORRETTO
const { data } = await supabaseServer
    .from('table_name')
    .select('*')
    .is('deleted_at', null)

// ❌ SBAGLIATO — restituisce anche record eliminati
const { data } = await supabaseServer
    .from('table_name')
    .select('*')
```

## Notifiche — Preferenze Utente

**Non esiste una tabella `notification_preferences` nel DB.** Le preferenze sono gestite in-memory tramite la costante `DEFAULT_PREFERENCES` in `lib/notifications-repository.ts`. Prima di fare dispatch di una notifica, controllare le preferenze dell'utente.

```typescript
// Pattern in notification-dispatcher.ts e notifications-repository.ts
const prefs = await getNotificationPreferences(targetUserId)
if (!prefs || prefs.some_type_enabled) {
    await dispatchNotification(targetUserId, notification)
}
```

## Schema Principale — Tabelle

```
-- DIZIONARI (lookup tables)
lookup_roles          — 8 ruoli applicativi (id text PK, label, capability flags)
                        values: 'player','coach','agent','sporting_director',
                                'athletic_trainer','nutritionist','physio','talent_scout'
lookup_sports         — Sport (id bigint, name unique): Calcio, Basket, Volley, Multi-sport
lookup_levels         — Livelli competizione (id bigint, name, rank_order)
lookup_positions      — Posizioni per sport+ruolo (id bigint, sport_id FK, role_id FK, name)

-- UTENTI
profiles              — Profili utenti (cuore del sistema)
  ├── id (UUID, FK → auth.users)
  ├── first_name, last_name, username (unique)
  ├── email, phone_number
  ├── role_id (FK → lookup_roles)   ← NON professional_role
  ├── bio, avatar_url, cover_url
  ├── city, country, birth_date, gender
  ├── latitude, longitude
  ├── privacy_settings (JSONB)
  ├── social_links (JSONB)          ← instagram, tiktok, youtube, transfermarkt...
  ├── player_self_evaluation (JSONB)
  ├── coach_self_evaluation (JSONB)
  ├── contract_status  ("svincolato" | "sotto contratto")
  ├── contract_end_date (date)
  ├── is_verified (boolean)
  └── deleted_at, created_at, updated_at

physical_stats        — Dati fisici (1:1 con profiles, opzionale)
  ├── user_id (UUID PK, FK → profiles)
  ├── height_cm, weight_kg
  ├── dominant_foot, dominant_hand
  └── additional_metrics (JSONB)

profile_sports        — Sport praticati per ruolo (M:N profiles ↔ lookup_sports ↔ lookup_roles)
  ├── user_id FK, sport_id FK, role_id FK (nullable, UNIQUE together via index)
  ├── level_id FK, primary_position_id FK
  ├── is_main_sport (boolean)
  └── deleted_at
  NOTE: role_id aggiunto per supportare sport diversi per ogni ruolo (es. player=Calcio, coach=Basket).
        NULL per righe legacy (pre-migrazione). Unique index usa COALESCE(role_id, '').

profile_secondary_positions  — Posizioni secondarie per profilo_sport
  ├── profile_sport_id FK, position_id FK

-- TRACKER INFORTUNI (GDPR-safe, nessun dato clinico)
athlete_injuries      — Registro funzionale infortuni (solo disponibilità e tempi recupero)
  ├── id (UUID PK)
  ├── athlete_profile_id FK → profiles
  ├── reported_by_profile_id FK → profiles  ← sempre l'utente loggato al momento dell'inserimento
  ├── injury_type (text check: 'Muscolare'|'Articolare'|'Trauma'|'Malattia'|'Altro')
  ├── body_part (text, nullable)
  ├── severity (enum: 'Lieve'|'Moderato'|'Grave')
  ├── start_date (date), expected_return_date (date, nullable)
  ├── status (enum: 'Active'|'Recovering'|'Resolved')
  ├── notes (text, nullable)
  └── deleted_at, created_at, updated_at
  Ruoli autorizzati a inserire per altri: physio, coach, sporting_director, athletic_trainer

-- CARRIERA
profile_experiences   — Storico carriera (ha SOSTITUITO career_experiences)
  ├── id (UUID), user_id FK, organization_id FK (nullable → sports_organizations)
  ├── profile_type (enum: player|coach|agent|sporting_director|...)
  ├── experience_kind (enum: club|national_team|academy|federation|...)
  ├── title (text, obbligatorio)
  ├── role_detail, season, category, category_tier
  ├── competition_type (enum: male|female|open|mixed)
  ├── start_date (date, obbligatorio), end_date (nullable)
  ├── is_current (boolean)
  ├── employment_type (enum: owned|loan|free_agent|tryout|other)
  ├── loan_from_organization_id FK (nullable)
  ├── description, is_public
  └── deleted_at, created_at, updated_at

-- ORGANIZZAZIONI SPORTIVE
sports_organizations  — DB società sportive (solo admin possono creare)
  ├── id (UUID), name, country, city
  ├── sport_id (bigint FK → lookup_sports)  ← NON colonna text "sport"
  └── deleted_at

organization_requests — Richieste utenti per nuove organizzazioni
  ├── id (UUID), requested_by FK, status ('pending'|'approved'|'rejected'|'duplicate')
  └── reviewed_by FK, created_organization_id FK

-- CLUBS
clubs                 — Società sportive registrate
  ├── id (UUID), owner_id FK, name
  ├── organization_id FK (nullable → sports_organizations)
  ├── description, city, logo_url, cover_url, website, founded_year
  ├── address, address_lat, address_lng
  ├── followers_count, members_count
  ├── sport_ids (bigint[])  ← legacy, preferire club_sports junction table
  └── deleted_at, created_at, updated_at

club_sports           — Sport di un club (N:N clubs ↔ lookup_sports)
  ├── club_id FK, sport_id FK (UNIQUE together)

club_join_requests    — Richieste di adesione al club
  ├── id (UUID), club_id FK, user_id FK
  ├── requested_role ('Admin'|'Staff'|'Player'), status ('pending'|'accepted'|'rejected')
  └── deleted_at

club_memberships      — Roster attuale del club
  ├── id (UUID), club_id FK, user_id FK
  ├── club_role ('Admin'|'Staff'|'Player'), status ('active'|'past'|'suspended')
  ├── professional_role_id FK → lookup_roles.id  ← contesto profilo (player/coach/...) della membership
  ├── permissions (JSONB), position_id FK
  └── deleted_at

-- STUDI PROFESSIONALI
professional_studios  — Studio professionale per ruoli medical/sport performance
  ├── id (UUID), owner_id FK, name
  ├── city, address, phone, website, logo_url, description
  ├── services_offered (JSONB array)
  └── deleted_at, created_at, updated_at

studio_clients        — Relazione studio ↔ clienti (athletes/profiles)
  ├── id (UUID), studio_id FK, client_profile_id FK
  ├── status ('pending'|'active'|'inactive')
  ├── notes, onboarded_at
  └── deleted_at, created_at, updated_at

studio_appointments   — Agenda appuntamenti studio
  ├── id (UUID), studio_id FK, client_id FK, professional_id FK
  ├── start_time, end_time, status, service_type, notes
  └── deleted_at, created_at, updated_at

studio_reviews        — Recensioni clienti verso studio (nuovo, Marzo 2026)
  ├── id (UUID), studio_id FK, reviewer_profile_id FK
  ├── rating (1..5), title, comment
  ├── is_verified, is_published
  ├── owner_response (text, nullable), owner_responded_at (timestamptz, nullable)  ← Marzo 2026
  └── deleted_at, created_at, updated_at

studio_specializations — Specializzazioni pubbliche mostrabili nella pagina studio (nuovo)
  ├── id (UUID), studio_id FK
  ├── name, description, icon, display_order
  └── deleted_at, created_at, updated_at

studio_faqs           — FAQ pubbliche per studio (nuovo)
  ├── id (UUID), studio_id FK
  ├── question, answer, display_order
  └── deleted_at, created_at, updated_at

-- MARKETPLACE
opportunities         — Annunci di lavoro
  ├── id (UUID), club_id FK, created_by FK
  ├── sport_id FK, role_id FK, position_id FK
  ├── status ('draft'|'open'|'closed'|'archived')
  └── deleted_at

applications          — Candidature
  ├── id (UUID), opportunity_id FK, applicant_id FK, agent_id FK (nullable)
  ├── status ('pending'|'viewed'|'accepted'|'rejected'|'withdrawn')
  └── deleted_at

-- SOCIAL
follows               — Follower/following (soft-delete)
  ├── PK (follower_id, following_id)
  └── deleted_at

blocks                — Utenti bloccati
  ├── PK (blocker_id, blocked_id)
  └── deleted_at

affiliations          — Agente ↔ Giocatore
  ├── id (UUID), agent_id FK, player_id FK
  ├── status ('pending'|'active'|'rejected'|'terminated')
  ├── start_date, end_date
  ├── requested_at, responded_at, affiliated_at
  ├── notes, message
  └── deleted_at

verifications         — Endorsement tra utenti
  ├── verifier_id FK, verified_id FK (UNIQUE)

favorites             — Bookmark profili
  ├── user_id FK, favorite_id FK (UNIQUE)

messages              — Chat 1-to-1
  ├── id (UUID), sender_id FK, receiver_id FK
  ├── content (text), is_read (boolean)
  └── deleted_at

notifications         — Notifiche in-app
  ├── id (UUID), user_id FK, type, title, message
  ├── metadata (JSONB), is_read (boolean)
  └── deleted_at

-- MULTI-ROLE (Marzo 2026)
profile_roles          — Ruoli attivi per utente (M:N profiles ↔ lookup_roles)
  ├── PK (user_id FK, role_id FK)
  ├── is_active (boolean), is_primary (boolean)
  ├── role_self_evaluation (JSONB, nullable)  ← autovalutazione scoped al ruolo
  └── created_at, updated_at
  NOTE: seeded da profiles.role_id alla prima migrazione. Unique index per un solo primary attivo.
  NOTE 2: `profiles.player_self_evaluation` e `profiles.coach_self_evaluation` restano per backward compatibility,
          ma il source of truth multi-ruolo è `profile_roles.role_self_evaluation` per `(user_id, role_id)`.

-- GESTIONE SQUADRE (Marzo 2026)
club_teams            — Squadre di un club (es. "Prima Squadra", "Under 19")
  ├── id (UUID), club_id FK, name, category, season
  ├── sport_id FK, created_by FK
  └── deleted_at, created_at, updated_at

team_members          — Membri di una squadra (giocatori + staff)
  ├── id (UUID), club_team_id FK, profile_id FK
  ├── role (enum: player|head_coach|assistant_coach|athletic_trainer|physio|nutritionist|team_manager|goalkeeper_coach)
  ├── jersey_number (1-99), status ('active'|'inactive'|'suspended'|'trial')
  ├── joined_at, notes
  └── deleted_at, created_at, updated_at
  Unique: (club_team_id, profile_id) WHERE deleted_at IS NULL

-- STUDI PROFESSIONALI (Marzo 2026)
professional_studios  — Studi per fisio/nutrizionisti
  ├── id (UUID), owner_id FK, name
  ├── city, address, phone, website, logo_url, description
  ├── services_offered (JSONB array)
  ├── years_of_experience (integer, nullable, CHECK >= 0)  ← Marzo 2026
  ├── languages (JSONB array, nullable)                   ← Marzo 2026
  ├── work_modes (JSONB array, nullable, CHECK valid values) ← Marzo 2026 (in-person|remote|hybrid)
  ├── certifications (JSONB array, nullable)              ← Marzo 2026
  ├── methodology (text, nullable)                        ← Marzo 2026
  ├── timezone (varchar default 'Europe/Rome'), booking_enabled (boolean default false)
  ├── auto_confirm_bookings (boolean default false), slot_increment_minutes (15|30|60, default 30)
  ├── default_buffer_between_appointments (0-60 minutes, default 5)
  └── deleted_at, created_at, updated_at

studio_clients        — Clienti di uno studio (atleti)
  ├── id (UUID), studio_id FK, client_profile_id FK
  ├── status (enum: pending|active|discharged), notes, onboarded_at
  └── deleted_at, created_at, updated_at
  Unique: (studio_id, client_profile_id)

athlete_medical_consents — Consenso atleta per accesso dati medici
  ├── id (UUID), athlete_id FK, requested_by_profile_id FK
  ├── status (enum: pending|approved|revoked|expired)
  ├── request_message, granted_at, revoked_at, expires_at
  └── created_at, updated_at
  Unique: (athlete_id, requested_by_profile_id)

-- CALENDARI (Marzo 2026)
team_events           — Allenamenti e partite di una squadra
  ├── id (UUID), team_id FK, created_by FK
  ├── event_type (enum: training|match|meeting|other)
  ├── title, date_time (timestamptz), duration_minutes, location, description
  ├── opponent (text), is_home (boolean)  ← solo per match
  └── deleted_at, created_at, updated_at

studio_appointments   — Appuntamenti studio professionista ↔ cliente
  ├── id (UUID), studio_id FK, client_id FK, professional_id FK
  ├── start_time, end_time (timestamptz), status (enum: pending|confirmed|completed|cancelled|no_show)
  ├── service_type, notes
  ├── appointment_type_id FK (nullable → studio_appointment_types), buffer_before_minutes (0-60)
  ├── buffer_after_minutes (0-60), google_event_id (varchar nullable)
  ├── google_sync_status (enum: not_synced|synced|sync_failed, default 'not_synced')
  └── deleted_at, created_at, updated_at

-- GOOGLE CALENDAR INTEGRATION (Marzo 2026)
google_calendar_connections — OAuth tokens e stato sync Google Calendar
  ├── id (UUID), professional_studio_id FK (unique WHERE deleted_at IS NULL)
  ├── encrypted_access_token (text), encrypted_refresh_token (text)  ← AES-256-GCM encrypted
  ├── token_expires_at (timestamptz), selected_calendar_id (text), selected_calendar_name (text)
  ├── sync_token (text), last_synced_at (timestamptz)
  ├── watch_channel_id (text), watch_resource_id (text), watch_expires_at (timestamptz)  ← 7-day expiration
  └── deleted_at, created_at, updated_at
  RLS: Owner-only read/write (tokens visibili solo al proprietario studio)

studio_availability_rules — Orari disponibilità settimanali (source of truth slot booking)
  ├── id (UUID), professional_studio_id FK (unique WHERE deleted_at IS NULL)
  ├── weekly_schedule (JSONB: {monday: [{start:"09:00",end:"13:00"},...], tuesday: [...], ...})
  ├── timezone (varchar default 'Europe/Rome')
  └── deleted_at, created_at, updated_at
  RLS: Public read, owner write

studio_blackout_dates — Date non disponibili (ferie, chiusure)
  ├── id (UUID), professional_studio_id FK
  ├── start_date (date), end_date (date), reason (text nullable)
  └── deleted_at, created_at, updated_at
  Constraint: end_date >= start_date
  RLS: Public read, owner write

studio_appointment_types — Catalogo servizi (tipo appuntamento con durata/buffer/prezzo)
  ├── id (UUID), professional_studio_id FK
  ├── name (varchar 100), description (text), duration_minutes (15-480)
  ├── buffer_before_minutes (0-60, default 0), buffer_after_minutes (0-60, default 0)
  ├── price_amount (decimal nullable), color_hex (varchar 7, default '#2341F0')
  ├── is_active (boolean default true)
  └── deleted_at, created_at, updated_at
  Constraint: color_hex formato #RRGGBB
  RLS: Public read (solo is_active=true), owner read all + write

studio_external_events — Cache eventi Google Calendar (conflict detection)
  ├── id (UUID), professional_studio_id FK
  ├── google_event_id (varchar 255, unique per studio WHERE deleted_at IS NULL), google_calendar_id (varchar 255)
  ├── start_time (timestamptz), end_time (timestamptz), summary (text), is_all_day (boolean)
  └── deleted_at, created_at, updated_at
  Constraint: end_time > start_time
  RLS: Owner-only read/write (event summaries privati)
```

## Migrations

Le modifiche allo schema vanno sempre in `supabase/migrations/` con naming:
`YYYYMMDD_descrizione_breve.sql`

Gli script di diagnostica e fix RLS vengono salvati in `supabase/scripts/` (non versionate come migrations).

## ID e Type Safety

Gli ID in Supabase sono **UUID** (stringhe). Nelle API routes, usare sempre `String()` per confronti:

```typescript
// ✅
const match = data.find(item => String(item.id) === String(targetId))
```

## Amministrazione e RLS

### Tabella `sports_organizations` — Solo Amministratori

Gli utenti normali possono **solo leggere** (autocomplete). La creazione di organizzazioni avviene **esclusivamente via SQL** da parte degli amministratori. Mai esporre endpoint POST pubblici per questa tabella.

**Template inserimento** (usare `sport_id`, non la colonna `sport` che non esiste più):
```sql
INSERT INTO public.sports_organizations (name, country, city, sport_id)
VALUES ('Nome Club', 'Italia', 'Città', (SELECT id FROM public.lookup_sports WHERE name = 'Calcio'))
ON CONFLICT (name, country, city, sport_id) DO NOTHING;
```

**Regole di naming:**
- Nome ufficiale: `"AC Milan"` non `"Milan"` o `"A.C. Milan"`
- Paese in italiano: `"Italia"`, `"Inghilterra"`, `"Spagna"`
- Sport in `lookup_sports`: `"Calcio"`, `"Basket"`, `"Volley"`

**Soft delete su `sports_organizations`:**
```sql
-- Soft delete
UPDATE public.sports_organizations SET deleted_at = NOW() WHERE id = '...';
-- Ripristino
UPDATE public.sports_organizations SET deleted_at = NULL WHERE id = '...';
```

### Query Admin Utili

```sql
-- Statistiche per sport
SELECT ls.name, COUNT(*) 
FROM public.sports_organizations so
JOIN public.lookup_sports ls ON so.sport_id = ls.id
WHERE so.deleted_at IS NULL GROUP BY ls.name;

-- Ultimi inserimenti
SELECT so.name, so.country, ls.name AS sport, so.created_at 
FROM public.sports_organizations so
JOIN public.lookup_sports ls ON so.sport_id = ls.id
WHERE so.deleted_at IS NULL ORDER BY so.created_at DESC LIMIT 20;
```
