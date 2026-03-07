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
```

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

## Tema Colori (Green Theme)

```tsx
// Pulsanti primari
"bg-green-600 hover:bg-green-700 text-white"

// Pulsanti outline
"border-2 border-green-600 text-green-600 hover:bg-green-50"

// Input focus
"focus:border-green-500 focus:outline-none"

// Link e accenti
"text-green-600 hover:text-green-700"

// Info box
"bg-green-50 border-green-100 text-green-900"

// Gradients (header, badge)
"bg-gradient-to-br from-green-400 to-green-600"

// Avatar fallback
"bg-gradient-to-br from-green-500 to-emerald-600"
```

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
  (onboarding)/ → onboarding nuovi utenti

components/   → tutti "use client"
  profile-*/  → componenti profilo
  navbar.tsx  → navigazione (green theme, dinamica in base a auth)
  avatar.tsx  → componente avatar riutilizzabile
  ...

lib/
  hooks/
    useAuth.tsx  → ⭐ hook auth principale
  supabase-browser.ts  → client lato browser
  types.ts     → TypeScript types condivisi
  countries.ts → dati paesi + flag emoji
```
