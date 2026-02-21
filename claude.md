# 🤖 Claude AI - Guida al Progetto SportLink

**Data ultima modifica**: 21 Febbraio 2026  
**Status**: Produzione (Deploy su Vercel + Supabase)

---

## 📌 Informazioni Cruciali

### 🚀 Stack Tecnologico Corrente

- **Frontend Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + DaisyUI
- **Mobile**: Expo/React Native (cartella `mobile/`)
- **Database**: **Supabase PostgreSQL** (migrato da JSON files)
- **Storage**: Supabase Storage per avatar/immagini
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Auth**: localStorage (demo) - migrazione a Supabase Auth in futuro

### ⚠️ Regole Fondamentali

1. **NON rompere la struttura Supabase esistente**
   - Tutte le modifiche al DB devono essere migrations in `supabase/migrations/`
   - Usare sempre RLS (Row Level Security) per le policy
   - Non creare mai query dirette senza passare per Supabase

2. **Compatibilità Vercel**
   - Tutte le API routes devono avere `export const runtime = 'nodejs'`
   - Usare sempre `@/lib/supabase-server` per le API routes server-side
   - Usare `@/lib/supabase-browser` per i componenti client-side

3. **CORS per Mobile**
   - Tutte le API routes devono wrappare le risposte con `withCors()` da `@/lib/cors`
   - Aggiungere handler `OPTIONS` per preflight requests

---

## 🗂️ Struttura Progetto

### Directory Principali

```
sportlink-demo/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Pagine autenticazione (login, signup)
│   ├── (landing)/                # Landing page pubblica
│   ├── (main)/                   # App principale (feed, profilo, ecc)
│   ├── (onboarding)/             # Onboarding nuovi utenti
│   └── api/                      # API Routes (backend)
│       ├── users/                # Gestione profili
│       ├── clubs/                # Gestione club
│       ├── opportunities/        # Annunci/lavori
│       ├── follows/              # Sistema follow
│       ├── messages/             # Messaggistica
│       └── ...                   # Tutte le altre API
│
├── components/                   # Componenti React Web
│   ├── profile-*.tsx             # Componenti profilo
│   ├── navbar.tsx                # Navigazione principale
│   ├── avatar.tsx                # Avatar component
│   └── ...
│
├── lib/                          # Utilities & Services
│   ├── supabase-server.ts        # ⭐ Client Supabase SERVER-SIDE
│   ├── supabase-browser.ts       # ⭐ Client Supabase CLIENT-SIDE
│   ├── types.ts                  # TypeScript types
│   ├── cors.ts                   # CORS helpers per mobile
│   ├── services/                 # Business logic services
│   └── hooks/                    # Custom React hooks
│
├── supabase/                     # ⭐ Configurazione Supabase
│   ├── migrations/               # SQL migrations
│   └── seed.sql                  # Dati seed
│
├── mobile/                       # App React Native (ISOLATA)
│   ├── screens/                  # Schermate mobile
│   ├── lib/                      # Utilities mobile
│   └── package.json              # Dipendenze separate
│
└── data/                         # ⚠️ DEPRECATO - JSON files legacy
```

---

## 🗄️ Database Supabase - Schema Principali

### Tabella `profiles`
**Cuore del sistema** - Profili utenti multi-ruolo

```sql
id                  UUID (PK)
email               TEXT UNIQUE
full_name           TEXT
avatar_url          TEXT
country             TEXT           -- ⭐ Campo nazionalità (es: "Italia")
city                TEXT
birth_date          DATE
professional_role   TEXT           -- "player", "coach", "agent", ecc
height              INTEGER        -- cm
weight              INTEGER        -- kg
preferred_foot      TEXT           -- "destro", "sinistro", "ambidestro"
bio                 TEXT
privacy_settings    JSONB
contract_status     TEXT           -- ⭐ "svincolato" o "sotto contratto"
contract_end_date   DATE           -- ⭐ Data fine contratto (solo se sotto contratto)
created_at          TIMESTAMPTZ
```

### Tabella `clubs`
Società sportive/polisportive

```sql
id                  UUID (PK)
name                TEXT
sport_ids           INTEGER[]      -- Array sport (calcio, basket, ecc)
country             TEXT
city                TEXT
logo_url            TEXT
```

### Tabella `career_experiences`
Esperienze professionali (giocatori, allenatori)

```sql
id                  UUID (PK)
profile_id          UUID (FK → profiles)
organization_name   TEXT
country             TEXT
category            TEXT
role                TEXT
from_date           DATE
to_date             DATE
is_currently_playing BOOLEAN
```

### Tabelle Social
- `follows` (follower_id → followed_id)
- `verifications` (endorsement tra utenti)
- `favorites` (bookmark profili)
- `affiliations` (agente ↔ giocatore)
- `messages` (chat 1-to-1)

### Tabelle Opportunità
- `opportunities` (annunci lavoro)
- `applications` (candidature)

---

## 🔧 Pattern di Sviluppo

### 1️⃣ API Route (Server-Side)

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS(req: Request) {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const { data, error } = await supabaseServer
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return withCors(NextResponse.json(data))
    } catch (error: any) {
        return withCors(NextResponse.json(
            { error: error.message },
            { status: 500 }
        ))
    }
}
```

### 2️⃣ Pagina Client-Side

```typescript
// app/(main)/profile/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Protezione route (se loggato)
        const currentUserId = localStorage.getItem('currentUserId')
        if (!currentUserId) {
            router.push('/login')
            return
        }

        // Fetch dati
        fetch(`/api/users?id=${params.id}`)
            .then(res => res.json())
            .then(data => {
                setUser(data)
                setLoading(false)
            })
    }, [params.id, router])

    if (loading) return <div>Loading...</div>
    if (!user) return <div>User not found</div>

    return <div>{/* UI */}</div>
}
```

### 3️⃣ Componente Riutilizzabile

```typescript
// components/avatar.tsx
'use client'
interface AvatarProps {
    src?: string | null
    alt?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ src, alt, size = 'md' }: AvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-24 h-24'
    }

    return (
        <img
            src={src || '/default-avatar.png'}
            alt={alt || 'User'}
            className={`${sizeClasses[size]} rounded-full object-cover`}
        />
    )
}
```

---

## 🎨 Sistema di Design

### Theme Sportlink (Green)
```css
/* Colori Primari */
--primary: #16a34a       /* green-600 */
--primary-hover: #15803d /* green-700 */
--primary-light: #f0fdf4 /* green-50 */
--accent: #22c55e        /* green-500 */
```

### Utility Classes Comuni
```tsx
// Pulsanti primari
"bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"

// Pulsanti outline
"border-2 border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg"

// Input fields
"border border-gray-300 rounded-lg px-4 py-2 focus:border-green-500 focus:outline-none"

// Cards
"bg-white border border-gray-100 rounded-lg shadow-sm p-4"
```

---

## 🔐 Autenticazione (Current State)

### ⚠️ Demo Mode - localStorage

**NON è produzione-ready**. Usiamo localStorage per semplicità:

```typescript
// Login
localStorage.setItem('currentUserId', user.id)
localStorage.setItem('currentUserName', user.full_name)
localStorage.setItem('currentUserEmail', user.email)
localStorage.setItem('currentUserRole', user.professional_role)

// Logout
localStorage.clear()

// Check auth
const userId = localStorage.getItem('currentUserId')
if (!userId) router.push('/login')
```

**Migrazione futura**: Supabase Auth con JWT tokens.

---

## 📱 Mobile App

### Struttura Isolata
- **NO monorepo**: `mobile/` ha il proprio `package.json`
- **React Native 0.78.6** con Expo
- **API calls**: Chiamano le stesse API routes del web (`/api/*`)
- **CORS**: Configurato in `lib/cors.ts` per accettare richieste mobile

### Sviluppo Mobile
```bash
# Terminal 1 - Server web (NECESSARIO per API)
pnpm dev

# Terminal 2 - Expo
cd mobile
pnpm install
pnpm start
```

---

## 🌍 Nazionalità e Bandiere

### Dati Paesi
Lista completa paesi con bandiere emoji in:
- `app/(main)/profile/edit/page.tsx` (array `allCountries`)
- Formato: `{ code: "IT", name: "Italia", flag: "🇮🇹" }`

### Utility Bandiere
**File**: `lib/countries.ts` (da creare se manca)
```typescript
export const getCountryFlag = (countryName: string): string | null => {
    const country = allCountries.find(c => c.name === countryName)
    return country?.flag || null
}
```

**Uso nei componenti**:
```tsx
import { getCountryFlag } from '@/lib/countries'

const flag = getCountryFlag(user.country)
// Mostra: <span>{flag} {user.country}</span>
```

---

## ✅ Checklist Pre-Implementation

Prima di ogni feature:

1. [ ] Ho letto DATABASE_BIBLE.md per capire lo schema?
2. [ ] La feature richiede una migration SQL?
3. [ ] Ho verificato che la modifica funzioni anche su Vercel?
4. [ ] Ho aggiunto CORS alle nuove API routes?
5. [ ] Ho testato che non rompa l'app mobile?
6. [ ] I componenti client hanno `'use client'` directive?
7. [ ] Sto usando `supabaseServer` nelle API e `supabaseBrowser` nei componenti?

---

## 🐛 Debugging Comune

### "Supabase not configured"
```typescript
// Verifica env variables
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### "CORS error" da mobile
```typescript
// Assicurati che l'API route abbia:
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS(req: Request) {
    return handleOptions()
}

export async function GET(req: Request) {
    // ...
    return withCors(NextResponse.json(data))
}
```

### "Hydration mismatch"
```typescript
// Usa pattern con useState/useEffect per dati da localStorage
const [isClient, setIsClient] = useState(false)

useEffect(() => {
    setIsClient(true)
}, [])

if (!isClient) return null
```

---

## 📚 Documentazione di Riferimento

- **DATABASE_BIBLE.md**: Schema completo Supabase + RLS policies
- **INTEGRATION_COMPLETE.md**: Storia migrazione JSON → Supabase
- **ADMIN_GUIDE.md**: Gestione utenti e admin panel
- **TEST_GUIDE.md**: Testing con Vitest
- **mobile/README.md**: Setup app mobile

---

## 🚀 Quick Commands

```bash
# Sviluppo web
pnpm dev                    # http://localhost:3000

# Sviluppo mobile
pnpm dev:mobile             # Avvia Expo (richiede web server attivo!)

# Database
pnpm supabase:start         # Supabase locale (se configurato)
pnpm supabase:migrate       # Applica migrations

# Test
pnpm test                   # Vitest
pnpm test:watch             # Watch mode
pnpm test:coverage          # Con coverage

# Lint & Build
pnpm lint                   # ESLint
pnpm build                  # Build produzione
```

---

## 💡 Tips per Claude AI

1. **Leggi sempre DATABASE_BIBLE.md** prima di modificare il DB
2. **Non creare mai file JSON** in `data/` (è legacy)
3. **Usa sempre le utility esistenti** (`lib/supabase-*`, `lib/types`)
4. **Chiedi conferma** prima di migration SQL complesse
5. **Testa sempre CORS** se modifichi API routes
6. **Mantieni coerenza** con il tema green (`green-600`, `green-700`)
7. **Documenta modifiche rilevanti** in questo file

---

**🎯 Goal**: Mantenere un'architettura pulita, scalabile e compatibile con Vercel + Supabase.
