# SportLink Demo

## Requisiti
- Node 20+, pnpm
- Supabase project (EU), prendi URL/keys

## Setup
```bash
pnpm i
cp .env.example .env
# compila .env con credenziali Supabase
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Deploy (Vercel)
1. Crea repo su GitHub e pusha.
2. Importa il repo su Vercel (Next.js auto-detected).
3. Aggiungi su Vercel le env vars: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Ogni PR crea una preview; `main` = produzione.

## Rotte utili
- `/search` per lista atleti
- `/needs` per creare un need → redirect a `/matches/:id`
