# 02 — Database & Supabase

> Verità emerse dall'audit del codice reale (Marzo 2026).

## Client Supabase — Quale Usare

| Client | File | Chiave | Bypassa RLS? | Quando usare |
|--------|------|--------|--------------|--------------|
| `supabaseServer` | `lib/supabase-server.ts` | Service Role Key (se configurata) | ✅ SÌ | API routes admin, operazioni che richiedono pieno accesso |
| `createServerClient()` | `lib/supabase-server.ts` | Anon Key + cookies | ❌ NO | API routes che rispettano i permessi utente |
| `supabase` | `lib/supabase-browser.ts` | Anon Key | ❌ NO | Componenti client-side |

**Regola**: Usare `supabaseServer` con parsimonia. Preferire `createServerClient()` nelle API routes normali se le RLS policies sono configurate correttamente.

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
  ├── permissions (JSONB), position_id FK
  └── deleted_at

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
  └── created_at, updated_at
  NOTE: seeded da profiles.role_id alla prima migrazione. Unique index per un solo primary attivo.

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
  └── deleted_at, created_at, updated_at
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
