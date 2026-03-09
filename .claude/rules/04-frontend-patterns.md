# 04 — Pattern Frontend

> Verità emerse dall'audit del codice reale (Marzo 2026).

## Auth — Sistema Ibrido

Il sistema di autenticazione usa **due layer** che lavorano insieme:

### Layer 1: Supabase Auth (reale)
`lib/hooks/useAuth.tsx` chiama `supabase.auth.signInWithPassword(email, password)` — autenticazione vera con Supabase.

### Layer 2: Snapshot localStorage (legacy + compatibilità)
Dopo il login, l'app scrive uno snapshot dello stato utente in `localStorage` per:
- Compatibilità con le pagine legacy che leggono localStorage direttamente
- Persistenza della sessione tra refresh

**Keys localStorage attive:**
```
currentUserId        — UUID dell'utente
currentUserEmail
currentUserName
currentUserRole      — "player" | "coach" | "agent" | ...
currentUserSports    — JSON array di sport
selectedClubId:<role> — club selezionato scoped per ruolo attivo (es. selectedClubId:coach)
```

### Club context scoped per ruolo (Home)

- In Home/Club widgets, il contesto club deve essere filtrato per `professionalRoleId`.
- Non usare una singola chiave globale `selectedClubId` come fonte primaria quando l'utente ha profili multipli.
- La chiave globale `selectedClubId` resta solo come fallback compatibilità legacy.

### Guard pagine role-specific (Affiliazioni)

- Le pagine role-specific (`/agent/affiliations`, `/player/affiliations`) devono validare prima `currentUserRole` (profilo attivo).
- Evitare guard bloccanti basate solo su `profiles.role_id` quando l'utente può avere ruoli multipli.
- Se il ruolo attivo non è coerente, redirect a `/home` con toast di accesso negato.

### Regola: Nei Nuovi Componenti

```typescript
// ✅ CORRETTO — usa sempre l'hook
import { useAuth } from '@/lib/hooks/useAuth'

export default function MyComponent() {
    const { user, isLoading, isAuthenticated, logout } = useAuth()
    // ...
}

// ❌ VIETATO nei nuovi componenti — non leggere localStorage direttamente
const userId = localStorage.getItem('currentUserId')  // NO!
```

**⚠️ Attenzione**: Molte pagine esistenti leggono localStorage direttamente. **Non rimuovere** quei pattern senza prima migrare completamente la pagina a `useAuth()`. Il localStorage deve restare funzionante come layer di compatibilità.

### Fetch verso endpoint protetti (POST/PATCH/DELETE)

Gli endpoint che verificano il JWT richiedono l'**Authorization header** con il Bearer token.
Usare sempre `getAuthHeaders()` da `lib/auth-fetch.ts` — per dettagli ed esempi completi → vedi **03-api-patterns.md** sezione "Client-side: getAuthHeaders()".

Se il server risponde `401`, significa che la sessione è scaduta: nelle pagine con form in modifica (es. edit profilo) preferire prima un messaggio in-page con azione di retry/login, evitando redirect immediato che perderebbe modifiche non salvate.

Per errori `403` (`forbidden_*_mismatch`), mostrare messaggio esplicito di mismatch account/sessione e invitare a ricaricare o rieffettuare login.

Per il salvataggio profilo multi-ruolo (`PATCH /api/users`), inviare anche:
- `activeRoleId`: ruolo attivo corrente (`currentUserRole`) normalizzato lowercase
- `roleSelfEvaluation`: autovalutazione del ruolo attivo

In backend questi campi vengono persistiti su `profile_roles.role_self_evaluation` (source of truth multi-ruolo),
con mirror legacy su `profiles.player_self_evaluation` / `profiles.coach_self_evaluation` per compatibilità.

### Query `profile_sports` — Scope per ruolo attivo

- In lettura, filtrare `profile_sports` per `role_id = currentUserRole` quando il contesto è role-specific.
- Mantenere fallback legacy su `role_id IS NULL` per i record pre-migrazione.
- In scrittura onboarding/edit role-specific, non cancellare tutti gli sport dell’utente: applicare delete/update solo sul ruolo attivo (`role_id` scoped) + fallback legacy `NULL`.

---

### hasCompletedProfile

```typescript
// Un utente ha completato il profilo se ha:
const hasCompletedProfile = !!(
    user?.sports && user.sports.length > 0 &&
    user?.professionalRole
)
// Usato per il flusso di onboarding
```

---

## Componenti Client vs Server

La maggior parte delle pagine e dei componenti usa `"use client"`. Eccezioni:
- `app/(main)/dashboard/page.tsx` — **Server Component** (async, accede ai cookie server-side)
- `components/widgets/` — **Server Components** async (NO 'use client'), wrappati in `<Suspense>`
- `app/actions/` — **Server Actions** con direttiva `'use server'`

```typescript
"use client"  // ← prima riga in qualsiasi pagina/componente CLIENT
```

---

## Route Protection (Pattern Legacy)

Nelle pagine che ancora usano localStorage direttamente:

```typescript
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }
        setUserId(id)
        setLoading(false)
    }, [router])

    if (loading || !userId) return null
    return <div>{/* contenuto */}</div>
}
```

Nelle **nuove** pagine, usa invece `useAuth()`:

```typescript
"use client"
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) router.push('/login')
    }, [user, isLoading, router])

    if (isLoading || !user) return null
    return <div>{/* contenuto */}</div>
}
```

---

## Fetch dei Dati (Client-Side)

Tutto il fetching è client-side, dopo il mount:

```typescript
const [data, setData] = useState<any>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
    fetch('/api/resource?userId=' + userId)
        .then(res => res.json())
        .then(json => {
            setData(json)
            setLoading(false)
        })
}, [userId])
```

---

## Tema Colori — Brand Navy & Blu

Il progetto usa un sistema **dual theme** (light + dark) con default visuale **light-first**.
Per la palette completa → vedi `design/BRAND_GUIDE.md`.

### Direzione Visuale Attuale — Minimal Clean Dual Theme (Marzo 2026)

- L'interfaccia default usa superfici chiare/neutrali per ridurre affaticamento visivo.
- Gli accenti brand blu restano selettivi (CTA, focus, stati attivi).
- `glass-page-bg`, `glass-panel` e `glass-widget` sono utility **token-based**: si adattano automaticamente al tema attivo (`sprinta-light` / `sprinta-dark`).
- Regola UX: evitare layout “all blue”; usare gerarchia **70/20/10**:
  - 70% superfici neutrali
  - 20% superfici secondarie (glass)
  - 10% accenti primari/interazioni

- **Light base** `#F8FAFC` — background principale default
- **Navy** `#10174A` — background principale in dark mode
- **Blu Primario** `#3B52F5` — bottoni, link, accenti
- **Font**: Neulis Sans (Adobe Typekit) + Inter (fallback) — configurato in `globals.css` e `tailwind.config.ts`

### Classi DaisyUI (temi `sprinta-light` / `sprinta-dark`)

```tsx
// Bottoni
"btn btn-primary"                          // bg #3B52F5, testo bianco
"btn btn-ghost"                            // trasparente, testo secondario

// Sfondo e testo
"bg-base-100"                              // background base adattivo per tema
"bg-base-200"                              // superficie secondaria adattiva
"bg-base-300"                              // superficie terziaria adattiva
"text-base-content"                        // testo primario adattivo
"text-secondary"                           // testo secondario adattivo
"text-primary"                             // #3B52F5

// Input focus
"focus:border-brand-500 focus:outline-none"

// Link e accenti
"text-brand-600 hover:text-brand-700"

// Gradients (header, badge)
"bg-gradient-to-br from-brand-400 to-brand-600"
```

### Utility visuali condivise (`app/globals.css`)

Per shell/dashboard usare preferibilmente le utility globali già definite:

- `.glass-page-bg` — sfondo pagina stratificato (radial + linear gradient)
- `.glass-nav` — navbar traslucida con blur e border soft
- `.glass-panel` — pannelli hero/header principali
- `.glass-widget` — card widget layered adattiva
- `.glass-widget-header` — header sezione/card coerente
- `.glass-subtle-text` / `.glass-quiet-text` — livelli testuali secondari adattivi

Regola: preferire queste utility rispetto a hardcode `bg-white` / `text-gray-*` / `text-white` nelle superfici principali.

### Toggle Tema Globale

- La preferenza tema è salvata in `localStorage` con chiave `sprinta-theme`.
- L'attributo globale `data-theme` viene impostato su `<html>` (`sprinta-light` oppure `sprinta-dark`).
- Il toggle UI è in `components/ui/theme-toggle.tsx` e viene mostrato in `components/navbar.tsx`.
- Prima dell'hydration, il tema viene inizializzato in `app/layout.tsx` via script inline per evitare flash/mismatch visivo.

Nelle pagine `messages`, `professionals` e `opportunities`, i componenti principali devono usare le utility glass e non card light legacy.

### ⚠️ Colori VIETATI

**Non usare MAI** le classi Tailwind `green-*` o `emerald-*` nel progetto. Tutto il verde va migrato a `brand-*`. I colori semantici DaisyUI (`success`, `warning`, `error`, `info`) restano invariati.

> **Nota**: alcuni file legacy (`address-autocomplete.tsx`, `dashboard-widgets/your-studio-widget.tsx`, `profile-sidebar.tsx`) hanno ancora classi `green-*` da migrare. Non aggiungerne di nuove.

---

## Hydration Mismatch — Prevenzione

Per dati che dipendono da localStorage (server ignora localStorage):

```typescript
const [isClient, setIsClient] = useState(false)

useEffect(() => {
    setIsClient(true)
}, [])

if (!isClient) return null  // evita hydration mismatch
```

---

## Comunicazione tra Componenti

- **Props drilling** per dati parent → child semplici
- **Callback props** per eventi child → parent: `onUpdate`, `onAdded`, `onDelete`
- **URL params** per dati a livello pagina: `app/profile/[id]/page.tsx` → `params.id`
- **useAuth()** per stato utente globale

---

## Struttura Cartelle Frontend

```
app/
  (auth)/     → login, signup (pagine senza navbar)
  (landing)/  → landing page pubblica
  (main)/     → app principale (richiede auth)
    dashboard/page.tsx  → ⭐ Dashboard Server Component (Fase 2 SaaS)
  (onboarding)/ → onboarding nuovi utenti
  actions/
    role-actions.ts            → ⭐ Server Actions: switchActiveRole(), getActiveRole()
    team-events-actions.ts     → createTeamEvent()
    team-management-actions.ts → ⭐ createTeam(), assignMemberToTeam(), removeMemberFromTeam()
    appointment-actions.ts     → bookAppointment()
    studio-actions.ts          → createOrUpdateStudio()
    injury-actions.ts          → reportInjury(), resolveInjury()

components/   → tutti "use client" (salvo widgets/ e future eccezioni SC)
  profile-*/  → componenti profilo
  navbar.tsx  → navigazione con toggle tema + auth context
  avatar.tsx  → componente avatar riutilizzabile
  ui/
    theme-toggle.tsx → ⭐ Client Component: switch tema light/dark
    RoleSwitcher.tsx  → ⭐ Client Component: dropdown ruolo attivo (DaisyUI)
  widgets/    → ⭐ SERVER Components (async, nessuna direttiva 'use client')
    TeamEventsWidget.tsx
    StudioAppointmentsWidget.tsx
    StudioSettingsWidget.tsx
    PhysicalStatusWidget.tsx      → ⭐ Stato fisico atleta + cronologia infortuni
    ReportInjuryModal.tsx         → Client Component: modal segnalazione infortunio
    ResolveInjuryButton.tsx       → Client Component: bottone "Segna Guarito"
  club-admin/ → ⭐ Componenti Area Club Admin
    TeamManagementWidget.tsx  → Client Component: gestione roster squadre
    CreateTeamModal.tsx       → Client Component: modal creazione squadra
    TeamRosterCard.tsx        → Client Component: card squadra con roster interattivo
    CreateTeamModal.tsx       → Client Component: modal creazione squadra
    TeamRosterCard.tsx        → Client Component: card squadra con roster interattivo

lib/
  hooks/
    useAuth.tsx  → ⭐ hook auth principale
  supabase-browser.ts  → client lato browser
  types.ts     → TypeScript types condivisi (ProfessionalRole, ROLE_TRANSLATIONS, ecc.)
  countries.ts → dati paesi + flag emoji
```

---

## Dashboard Studio — Pattern (Marzo 2026)

La dashboard studio usa ora route annidate con sidebar fissa:

```text
app/(main)/studios/[id]/dashboard/
  layout.tsx                 → sidebar e navigazione sezioni
  page.tsx                   → redirect compatibilità (`?tab=...` → nuova route)
  overview/page.tsx          → KPI + quick actions
  calendar/page.tsx          → OAuth Google + selezione calendario + sync/disconnect + FullCalendar (month/week/day)
  availability/page.tsx      → regole settimanali + blackout dates
  services/page.tsx          → CRUD tipi appuntamento
  bookings/page.tsx          → lista prenotazioni + cambio stato
  settings/page.tsx          → dati studio + booking settings
```

Regole:
- I fetch autenticati in dashboard studio usano sempre `getAuthHeaders()`.
- Link legacy `?tab=edit|appointments|clients` devono continuare a funzionare via redirect in `dashboard/page.tsx`.
- Le callback OAuth Google reindirizzano a `/studios/[id]/dashboard/calendar?connected=true`.
- La vista calendario usa `FullCalendar` con switch mese/settimana/giorno e legge eventi da `/api/studios/[id]/calendar-events`.
- La selezione di uno slot libero in calendar crea un blocco personale su `studio_external_events` via `/api/studios/[id]/external-blockers`.

---

## Dashboard SaaS — Pattern (Marzo 2026)

### Context Switcher via Cookie (no Zustand, no Redux)
Il ruolo attivo dell'utente è salvato in un **cookie HTTP-only** `sprinta_active_role`.

- **Scrittura**: Server Action `switchActiveRole(roleId, authToken?)` in `app/actions/role-actions.ts` — imposta il cookie e chiama `revalidatePath('/', 'layout')`.
  - Se la sessione cookie server-side non è disponibile, può verificare l'utente tramite Bearer token (`authToken`) inviato dal client.
- **Lettura**: helper `getActiveRole()` importato direttamente nei Server Components — nessun fetching client-side.
- **UI**: `RoleSwitcher.tsx` usa `useTransition` per chiamare `switchActiveRole` con stato di pending inline.

```typescript
// ✅ In un Server Component (es. dashboard/page.tsx)
import { getActiveRole } from '@/app/actions/role-actions'
const activeRole = await getActiveRole() // legge il cookie server-side

// ✅ In un Client Component che chiama la action
import { useTransition } from 'react'
import { switchActiveRole } from '@/app/actions/role-actions'
const [isPending, startTransition] = useTransition()
const handleSwitch = (role) => startTransition(async () => await switchActiveRole(role))
```

### Widget Server Components con Suspense Streaming

I widget in `components/widgets/` sono **Server Components async** (NO 'use client').  
Vengono wrappati in `<Suspense fallback={<Skeleton />}>` nella pagina madre, che streamma immediatamente il skeleton mentre il fetch DB è in corso.

```tsx
// ✅ Pattern nella dashboard page (Server Component)
<Suspense fallback={<WidgetSkeleton />}>
    <TeamEventsWidget userId={user.id} activeRole={activeRole} />
</Suspense>
```

**Regola**: i widget sono selezionati condizionalmente in base all'`activeRole` prima di essere montati — non viene renderizzato un widget se il ruolo non è pertinente:</p>
- `TEAM_ROLES` (`player`, `coach`, `sporting_director`, `athletic_trainer`) → `TeamEventsWidget`
- `STUDIO_ROLES` (`physio`, `nutritionist`) → `StudioAppointmentsWidget`
- `DUAL_ROLES` (`athletic_trainer`, `talent_scout`, `agent`) → entrambi i widget

---

## Home Dashboard UX — Tab Layout (Marzo 2026)

La pagina `app/(main)/home/page.tsx` usa ora una composizione **a tab** per evitare stacking di sezioni eterogenee nello stesso viewport.

Pattern:
- Tab role-aware (render solo se pertinenti):
  - `personal` → player/coach/sporting_director
  - `staff` → athletic_trainer/nutritionist/physio/talent_scout
  - `agent` → agent
  - `club` → gestione società (admin context)
  - `studio` → ruoli medical con studio
- La tab attiva viene re-impostata automaticamente su una tab visibile quando cambia ruolo/contesto.
- Evitare la duplicazione dello stesso widget in più sezioni visibili contemporaneamente.

Regola:
- In Home preferire una sola sezione primaria visibile alla volta (via tab) invece di concatenare più blocchi verticali con contenuti simili.

## Dashboard Widgets — Surface Unification (Marzo 2026)

I widget in `components/dashboard-widgets/` devono usare lo stesso linguaggio visivo dark:
- contenitore: `.glass-widget`
- header: `.glass-widget-header`
- testo secondario: `.glass-subtle-text` / `.glass-quiet-text`

Regole:
- Non introdurre nuove card `bg-white` / `text-gray-*` nei widget dashboard principali.
- Stati semantici restano DaisyUI (`success`, `warning`, `error`, `info`) senza creare palette custom parallele.

## Opportunities UX — Agent Flow & Tab Alias (Marzo 2026)

La pagina `app/(main)/opportunities/page.tsx` usa ora un flusso candidatura agente non bloccante:

- ❌ vietato usare `prompt()` per selezionare assistiti
- ❌ vietato usare `alert()` / `confirm()` nativi nei flow azione principali
- ✅ usare modal inline con lista assistiti + submit esplicito
- ✅ usare modal di conferma inline per azioni distruttive (delete/withdraw)
- lo stato submit deve disabilitare il bottone per evitare doppio invio

Compatibilità tab:
- `?tab=clubs` e `?tab=my-clubs` devono aprire la stessa vista club (alias legacy supportato)

Ruoli:
- confrontare i ruoli sempre normalizzati lowercase (`agent`, `player`, ecc.)
- evitare confronti case-sensitive con label UI capitalizzate

## Messages UX — Glass Split View + Group Chat (Marzo 2026)

La pagina `app/(main)/messages/page.tsx` usa una shell dark glass coerente con Home/Dashboard.

### URL Deep-link
- `?chat=<peerId>` → chat 1:1 (`ChatPanel`)
- `?group=<groupId>` → chat di gruppo (`GroupChatPanel`)

### ConversationList — Unified Feed
`ConversationList` ora mostra in un'unica lista ordinata per timestamp:
- Chat 1:1 (`ConversationSummary`)
- Gruppi (`GroupConversationSummary`) — con avatar iniziali + icona `Users` in overlay

Props obbligatorie della nuova versione: `groups`, `selectedGroupId`, `onSelectGroup`

### GroupChatPanel — Architettura
- Fetch da `/api/groups/${groupId}/messages?userId=U` → `{ messages, firstUnreadMessageId }`- Fetch da `/api/groups/${groupId}` → `{ name, members }`
- Realtime INSERT/UPDATE via Supabase `postgres_changes` su `group_messages`
- Batch read receipts: POST `/api/groups/${groupId}/reads` con tutti gli `id` messaggi al mount
- Stessa logica scroll `isFirstLoadRef` → instant primo caricamento, smooth dopo
- `showSenderName={!isMine}`, `senderColor={msg.senderColor}` passati a `MessageBubble`
- Props: `{ groupId, currentUserId, groups, onBack, showBackButton, onGroupDeleted }`

### NewChatModal — Crea Gruppo CTA
Il modal ha ora un pulsante "Nuovo gruppo" sopra la lista utenti che apre `CreateGroupModal`.
- Props aggiuntive: `onGroupCreated?: (groupId: string, groupName: string) => void`
- `CreateGroupModal` si sovrappone al `NewChatModal`, poi entrambi si chiudono a creazione avvenuta.

### Tipi Chiave Per i Messaggi Di Gruppo
- `GroupConversationSummary.id` — campo group ID (NON `groupId`)
- `GroupConversationSummary.name` — nome gruppo (NON `groupName`)  
- `GroupConversationSummary.unread` — badge non letti (NON `unreadCount`)
- `GroupMessage` NON ha `read` o `readCount` — usare `reactions?: MessageReaction[]` e `readers?`
- `BubbleMessage` ha `read?: boolean` (opzionale) per compatibilità con `GroupMessage`
- `ReplyPreview.text` è `string` (non nullable) — usare `?? ''` quando si assegna da `string | null`

### Reazioni — Sistema
- Tipi: `'like' | 'love' | 'fire' | 'trophy' | 'zap' | 'star'` — verificati server-side
- Icone: `REACTION_ICONS` e `REACTION_LABELS` in `components/messages/reactionIcons.ts`
- Toggle: POST `/api/messages/${id}/reactions` o `/api/groups/${gId}/messages/${mId}/reactions`
- UI: pill con icona + count sul bubble; hovering mostra quick-picker; click pill → `ReactionsPopover`

### Regole
- Preservare deep-link `?chat=<peerId>` e `?group=<groupId>`
- Comportamento responsive: toggle lista/chat su mobile
- NO emoji in UI — solo Lucide icons + testo italiano
- Soft-delete sempre (mai hard delete di messaggi)
- Finestra modifica: 15 minuti (`EDIT_WINDOW_MS`) — enforced server-side

### New Chat Modal — Accessibilità
- root con `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- chiusura tastiera con tasto `Escape`
- superfici allineate a `glass-widget` / `glass-widget-header`

## Discover UX — Filter Surface (Marzo 2026)

La sidebar filtri in `components/dynamic-filter-bar.tsx` usa ora controlli dark coerenti con tema dashboard:

- contenitore: `glass-widget`
- label: testo `text-secondary`
- input/select: fondo `base-300` con focus `primary`

Regola:
- non usare nuove varianti `bg-white` / `border-gray-*` nei filtri principali della pagina Scopri
