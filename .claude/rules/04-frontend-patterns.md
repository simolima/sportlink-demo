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
Il browser Supabase client salva i token in **localStorage**, non in cookie.
Usare sempre `getAuthHeaders()` da `lib/auth-fetch.ts`:

```typescript
import { getAuthHeaders } from '@/lib/auth-fetch'

// ✅ CORRETTO — invia il Bearer token con la sessione Supabase
const res = await fetch('/api/messages', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ senderId, receiverId, text }),
})

// Per GET autenticate
const authHeaders = await getAuthHeaders()
const res = await fetch('/api/resource', { headers: authHeaders })
```

Se il server risponde `401`, significa che la sessione è scaduta → redirect al login.

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

## Tutte le Pagine: "use client"

```typescript
"use client"  // ← sempre prima riga in qualsiasi pagina/componente
```

Non esistono Server Components in questo progetto.

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

Il progetto usa un **tema scuro** con palette navy/blu. I colori principali sono:

- **Navy** `#0A0F32` — background principale
- **Blu Primario** `#2341F0` — bottoni, link, accenti

### Font: Neulis Sans (Adobe Typekit) + Inter (fallback)

Configurato in `globals.css` (import Typekit) e `tailwind.config.ts` (fontFamily).

### Palette `brand-*` (Tailwind custom)

Definita in `tailwind.config.ts` sotto `theme.extend.colors.brand`:

```
brand-50:  #eff1fe   — sfondi leggerissimi
brand-100: #e0e4fd   — sfondi badge, stati attivi
brand-200: #c7ccfb   — bordi leggeri
brand-300: #a5acf8   — bordi, hover leggeri
brand-400: #8186f3   — accent secondari
brand-500: #5f64ec   — accent medi
brand-600: #2341f0   — ⭐ PRIMARIO (bottoni, icone, link)
brand-700: #1c37cf   — hover bottoni primari
brand-800: #1d2ea8   — testo scuro su badge chiari
brand-900: #1e2b83   — testo molto scuro
brand-950: #0a0f32   — ⭐ Navy background
```

### Classi DaisyUI (tema `sprinta`)

```tsx
// Bottoni
"btn btn-primary"                          // bg #2341F0, testo bianco
"btn btn-ghost"                            // trasparente, testo secondario

// Sfondo e testo
"bg-base-100"                              // Navy #0A0F32
"bg-base-200"                              // Navy dark #11152F
"bg-base-300"                              // Navy darker #141A3A
"text-secondary"                           // #A7B0FF (testo principale su scuro)
"text-primary"                             // #2341F0

// Input focus
"focus:border-brand-500 focus:outline-none"

// Link e accenti
"text-brand-600 hover:text-brand-700"

// Info box / badge
"bg-brand-50 border-brand-100 text-brand-900"

// Gradients (header, badge)
"bg-gradient-to-br from-brand-400 to-brand-600"

// Avatar fallback
"bg-gradient-to-br from-brand-500 to-brand-600"
```

### ⚠️ Colori VIETATI

**Non usare MAI** le classi Tailwind `green-*` o `emerald-*` nel progetto. Tutto il verde è stato migrato a `brand-*`. I colori semantici DaisyUI (`success`, `warning`, `error`, `info`) restano invariati.

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

components/   → tutti "use client" (salvo widgets/ e future eccezioni SC)
  profile-*/  → componenti profilo
  navbar.tsx  → navigazione (brand theme navy/blu, dinamica in base a auth)
  avatar.tsx  → componente avatar riutilizzabile
  ui/
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
