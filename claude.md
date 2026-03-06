# CLAUDE.md | Sprinta Living Documentation

> **Ultimo aggiornamento**: Marzo 2026  
> **Status**: Produzione (Vercel + Supabase PostgreSQL)

**Sprinta** è una piattaforma sociale duale (web + mobile) per atleti, club e agenti sportivi.

---

## Architettura in sintesi

| Aspetto | Dettaglio |
|---------|-----------|
| Web | Next.js 14 (App Router) + React 18 + Tailwind/DaisyUI |
| Mobile | Expo + React Native 0.78.6 (cartella `mobile/`, isolata) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (avatar, cover) |
| Auth | Supabase Auth (reale) + snapshot localStorage (compatibilità) |
| Deploy | Vercel (web) + Supabase (backend) |
| API | Next.js App Router routes (`app/api/`) CORS-enabled |

---

## ⚠️ Regole Inviolabili per l'AI (Leggere Sempre Prima)

### 1. DEFINITION OF DONE: LIVING DOCS (Auto-Update Obbligatorio)
> **Essendo tu a scrivere il codice, QUESTA È LA TUA DEFINITION OF DONE: NON puoi dichiarare un task concluso finché non hai verificato se le tue modifiche richiedono un aggiornamento delle regole.**
> Ogni volta che introduci una nuova libreria, modifichi strutturalmente un pattern architetturale, aggiungi una tabella al database o cambi un flusso (es. auth, API, state management), **DEVI AUTONOMAMENTE AGGIORNARE** il file corrispondente in `.claude/rules/` nella stessa sessione di lavoro.

- Se aggiungi/rimuovi una dipendenza → aggiorna `01-stack.md`.
- Se modifichi lo schema o logiche di query → aggiorna `02-database.md`.
- Se cambi il formato di risposta/CORS delle API → aggiorna `03-api-patterns.md`.
- Se modifichi l'autenticazione o la UI → aggiorna `04-frontend-patterns.md`.

### 2. CONTEXT7: Uso Controllato (Risparmio Token)
> **NON usare il tool MCP Context7 di default.**
> Usalo ESCLUSIVAMENTE in questi due casi:
> 1. L'utente scrive esplicitamente `"usa context7"` o `"@context7"` nel prompt.
> 2. Il codice generato per Next.js, Supabase o Expo produce errori di deprecazione.

Quando usi Context7, fai sempre ricerche iper-specifiche con termini esatti per minimizzare l'uso dei token.

---

## File di Regole

Le convenzioni architetturali complete sono documentate in `.claude/rules/`. Consultale sempre prima di scrivere codice relativo al loro dominio:

| File | Contenuto |
|------|-----------|
| [01-stack.md](.claude/rules/01-stack.md) | Stack tecnologico, librerie attive, deploy, comandi dev |
| [02-database.md](.claude/rules/02-database.md) | Schema Supabase, mapping snake_case↔camelCase, soft-delete, notifiche |
| [03-api-patterns.md](.claude/rules/03-api-patterns.md) | Template API routes, `withCors()`, SSE/Vercel |
| [04-frontend-patterns.md](.claude/rules/04-frontend-patterns.md) | Auth ibrido, `useAuth()`, route protection, tema colori |
| [05-testing.md](.claude/rules/05-testing.md) | Comandi e convenzioni per l'esecuzione dei test |

---

## Struttura Progetto

```text
sprinta/
 .claude/rules/            Documentazione vivente (PRIORITARIA)
 app/
    (auth)/              login, signup
    (landing)/           landing pubblica
    (main)/              app principale
    (onboarding)/        onboarding
    api/                 API routes (CORS-enabled)
 components/               Componenti web ("use client")
 lib/
    hooks/useAuth.tsx    Hook auth principale
    supabase-server.ts   Client server-side (service role / anon)
    supabase-browser.ts  Client browser (anon key)
    cors.ts              withCors(), handleOptions()
    types.ts             TypeScript types
 mobile/                   App Expo (dipendenze isolate)
 supabase/
    migrations/          Schema migrations versionate
    scripts/             Script diagnostica e fix RLS
 _archive_storico/         Documenti storici (esclusi dal context)
```

---

## Checklist Pre-Implementazione (Per l'AI)

Prima di generare il codice, verifica:

- [ ] Ho letto il file `.claude/rules/` pertinente alla modifica?
- [ ] Le API routes hanno `export const runtime = 'nodejs'` + `withCors()` + handler `OPTIONS`?
- [ ] Sto usando `supabaseServer` (lib/) in server-side e non Prisma?
- [ ] Il mapping snake_case ↔ camelCase è gestito nelle API routes e non demandato al frontend?
- [ ] Le query su tabelle con soft-delete includono `.is('deleted_at', null)`?
