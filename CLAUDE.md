# CLAUDE.md | Sprinta Living Documentation

> **Ultimo aggiornamento**: Marzo 2026  
> **Status**: Produzione (Vercel + Supabase PostgreSQL)

**Sprinta** è una piattaforma sociale duale (web + mobile) per atleti, club e agenti sportivi.

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

### 3. COMMIT MESSAGE (Obbligatorio a fine risposta)
Alla fine di ogni modifica, includi sempre una proposta di messaggio di commit nel formato:
`fix: ...` oppure `feat: ...`

---

## File di Regole

Le convenzioni architetturali complete sono documentate in `.claude/rules/`. Consultale sempre prima di scrivere codice relativo al loro dominio:

| File | Contenuto |
|------|-----------|
| [01-stack.md](.claude/rules/01-stack.md) | Stack tecnologico, librerie attive, deploy, comandi dev, testing |
| [02-database.md](.claude/rules/02-database.md) | Schema Supabase, mapping snake_case↔camelCase, soft-delete, notifiche |
| [03-api-patterns.md](.claude/rules/03-api-patterns.md) | Template API routes, `withCors()`, JWT security, SSE/Vercel |
| [04-frontend-patterns.md](.claude/rules/04-frontend-patterns.md) | Auth ibrido, `useAuth()`, route protection, tema colori, Dashboard SaaS |
