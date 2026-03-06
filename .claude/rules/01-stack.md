# 01 — Stack & Tecnologie

> Verità emerse dall'audit del codice reale (Marzo 2026). Priorità assoluta su qualsiasi vecchio documento.

## Framework & Runtime

- **Next.js 14** (App Router) — tutte le pagine usano `"use client"` directive
- **React 18** (web) / **React Native 0.78.6** (mobile)
- **TypeScript** — loosely typed in molti punti, `any` usato di frequente
- **Node.js** — tutte le API routes devono avere `export const runtime = 'nodejs'`

## Database & Backend

- **Supabase PostgreSQL** — unico database attivo
- **Supabase Storage** — per avatar e immagini
- **Prisma**: **NON installato e NON presente** nel progetto. Non generare mai query Prisma.
- Tutte le operazioni DB passano per `lib/supabase-server.ts` o `lib/supabase-browser.ts`.

## Frontend & Styling

- **Tailwind CSS** + **DaisyUI** — sistema di design
- **TanStack React Query v5** (`@tanstack/react-query`) — attivo nel progetto
- **react-hook-form** + **zod** — per form e validazione
- **framer-motion** — installato come dipendenza di produzione (animazioni)

## Icone — Sistema Ibrido

**Tre librerie sono installate e attive**. Non aggiungerne altre.

| Libreria | Import | Uso |
|----------|--------|-----|
| `@heroicons/react` | `@heroicons/react/24/outline` o `/solid` | Componenti principali |
| `lucide-react` | `lucide-react` | Alcuni componenti più recenti |
| `react-icons` | `react-icons/fa` (ecc.) | Usata in `social-links.tsx` per brand icons |

Quando aggiungi icone: usa quella già presente nel file/contesto circostante. In caso di dubbio, preferisci `@heroicons/react`.

## Mobile App

- **Expo** con **React Native 0.78.6**
- Cartella `mobile/` con **dipendenze completamente isolate** (proprio `package.json`, no monorepo)
- **IP auto-configurato via Expo SDK** (`Constants.expoConfig?.hostUri`) — nessuna configurazione manuale dell'indirizzo IP
- In produzione punta a `https://sportlink-demo.vercel.app`

## Deploy

- **Vercel** — web app (Next.js)
- **Supabase** — database + storage + auth backend

## Comando Sviluppo

```bash
# Web
pnpm dev                 # http://localhost:3000

# Mobile (richiede web server attivo)
pnpm dev:mobile          # Expo Metro Bundler

# Test
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Testing

- **Vitest** — test runner
- **@testing-library/react** + **jsdom** — per componenti
- Test in cartelle `__tests__/` accanto ai file sorgente
