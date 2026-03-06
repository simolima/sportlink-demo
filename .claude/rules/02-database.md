# 02 — Database & Supabase

> Verità emerse dall'audit del codice reale (Marzo 2026).

## Client Supabase — Quale Usare

| Client | File | Chiave | Bypassa RLS? | Quando usare |
|--------|------|--------|--------------|--------------|
| `supabaseServer` | `lib/supabase-server.ts` | Service Role Key (se configurata) | ✅ SÌ | API routes admin, operazioni che richiedono pieno accesso |
| `createServerClient()` | `lib/supabase-server.ts` | Anon Key + cookies | ❌ NO | API routes che rispettano i permessi utente |
| `supabaseBrowser` / `createBrowserClient()` | `lib/supabase-browser.ts` | Anon Key | ❌ NO | Componenti client-side |

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

Il database usa sempre **lowercase** per i ruoli:

| DB (snake_case) | Frontend |
|-----------------|----------|
| `"player"` | `"Player"` o `"player"` |
| `"coach"` | `"Coach"` o `"coach"` |
| `"agent"` | `"Agent"` o `"agent"` |
| `"club_manager"` | varia |

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

Prima di fare dispatch di una notifica, **controllare sempre** le preferenze dell'utente destinatario in `notification_preferences`. Se le preferenze lo richiedono, skippare la notifica.

```typescript
// Pattern in notification-dispatcher.ts e notifications-repository.ts
const prefs = await getNotificationPreferences(targetUserId)
if (!prefs || prefs.some_type_enabled) {
    await dispatchNotification(targetUserId, notification)
}
```

## Schema Principale — Tabelle

```
profiles              — Profili utenti (cuore del sistema)
  ├── id (UUID)
  ├── email, full_name, avatar_url
  ├── country, city, birth_date
  ├── professional_role   ("player", "coach", "agent", ...)
  ├── height (cm), weight (kg), preferred_foot
  ├── bio, privacy_settings (JSONB)
  ├── contract_status     ("svincolato" | "sotto contratto")
  └── contract_end_date

clubs                 — Società sportive
  ├── id, name, sport_ids (INTEGER[])
  ├── country, city, logo_url

career_experiences    — Storico carriera
  ├── profile_id (FK → profiles)
  ├── organization_name, country, category, role
  ├── from_date, to_date, is_currently_playing

follows               — Sistema follower/following
affiliations          — Agente ↔ Giocatore
verifications         — Endorsement tra utenti
favorites             — Bookmark profili
messages              — Chat 1-to-1
opportunities         — Annunci di lavoro
applications          — Candidature
notifications         — Notifiche in-app
notification_preferences — Preferenze notifiche per utente
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

**Template inserimento:**
```sql
INSERT INTO public.sports_organizations (name, country, city, sport) 
VALUES ('Nome Club', 'Italia', 'Città', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;
```

**Regole di naming:**
- Nome ufficiale: `"AC Milan"` non `"Milan"` o `"A.C. Milan"`
- Paese in italiano: `"Italia"`, `"Inghilterra"`, `"Spagna"`
- Sport: `"Calcio"`, `"Basket"`, `"Volley"` (valori standard)

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
SELECT sport, COUNT(*) FROM public.sports_organizations WHERE deleted_at IS NULL GROUP BY sport;

-- Ultimi inserimenti
SELECT name, country, sport, created_at FROM public.sports_organizations
WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 20;
```
