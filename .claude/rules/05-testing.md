# 05 — Testing

> Convenzioni e comandi per i test del progetto (Marzo 2026).

## Comandi

```bash
pnpm test              # Esegue tutti i test (una sola volta)
pnpm test:watch        # Modalità watch (ri-esegue al salvataggio)
pnpm test:coverage     # Esegue test con report coverage
```

## Stack

- **Vitest** — test runner
- **@testing-library/react** + **jsdom** — per componenti React
- **vitest.config.ts** e **vitest.setup.ts** nella root del progetto

## Convenzioni

- I test vanno in cartelle `__tests__/` accanto ai file sorgente
- Preferire `describe` + `it` per strutturare i test
- Mock di Supabase e fetch con `vi.mock()` / `vi.fn()`
- Non testare logica di UI manuale: i test riguardano unità e API utilities

## Esempio Struttura

```
lib/
  hooks/
    useAuth.tsx
    __tests__/
      useAuth.test.ts
components/
  navbar.tsx
  __tests__/
    navbar.test.tsx
```
