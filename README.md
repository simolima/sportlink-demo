# Sportlink Demo — Onboarding rapido

Questo repository contiene una demo di Sportlink (Next.js + Prisma + Supabase). Qui trovi istruzioni chiare per mettere l'ambiente in locale, lavorare in team su nuove feature e verificare la connessione al database Supabase.

Se preferisci una versione breve: segui i comandi nella sezione "Quick start".

## Quick start (per chi vuole partire subito)
1. Clona la repo e entra nella cartella:

```powershell
git clone https://github.com/simolima/sportlink-demo.git
cd sportlink-demo
pnpm install
```

2. Crea un file `.env` a partire dall'esempio (se presente) e aggiungi le variabili richieste: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e opzionalmente `SUPABASE_SERVICE_ROLE_KEY` (solo server).

3. Avvia il progetto in sviluppo (Windows PowerShell consigliato):

```powershell
pnpm.cmd dev
# oppure, se preferisci usare pnpm in PowerShell dopo aver consentito l'esecuzione degli script:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
pnpm dev
```

4. Apri il browser su `http://localhost:3000`.

--

## Cosa installare (dipendenze principali)
- Node.js (consigliato LTS v18/20)
- pnpm (consigliato): https://pnpm.io/installation
- Docker (opzionale, per avviare Postgres in locale)

La maggior parte dei comandi nella guida usa `pnpm` (usa `pnpm.cmd` su PowerShell se hai restrizioni sugli script).

## Variabili d'ambiente (.env)
Inserisci le seguenti (esempi):

- `DATABASE_URL` — connection string Postgres (Supabase). Non committare questo file.
- `NEXT_PUBLIC_SUPABASE_URL` — URL pubblico del progetto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chiave anon per il client.
- `SUPABASE_SERVICE_ROLE_KEY` — chiave server (solo server; non esporre nel client).

Esempio (NON incollare i segreti pubblicamente):

```powershell
#$env:DATABASE_URL = "postgresql://user:pass@db.supabase.co:5432/postgres?schema=public"
#$env:NEXT_PUBLIC_SUPABASE_URL = "https://xyz.supabase.co"
#$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ..."
```

## Prisma — comandi utili
- Genera client Prisma:

```powershell
pnpm exec prisma generate
```

- Applica migrazioni (dev, crea nuova migration e la applica):

```powershell
pnpm run db:migrate
```

- Applica migrazioni già committate (deploy/CI):

```powershell
pnpm exec prisma migrate deploy
```

- Apri Prisma Studio per ispezionare il DB (http://localhost:5555):

```powershell
pnpm exec prisma studio
```

> Nota: se stai usando un DB Supabase condiviso, assicurati di essere coordinato con gli altri prima di eseguire `migrate dev`.

## Supabase — cosa e come
- Supabase fornisce il DB Postgres, Auth e Storage. Se hai già creato il progetto su Supabase, imposta la `DATABASE_URL` e le chiavi in `.env` come sopra.
- Apri la dashboard Supabase → Database → Table Editor o SQL Editor per eseguire query direttamente, esportare o cancellare dati.

Esempi SQL utili da incollare nel SQL editor di Supabase:

```sql
-- Elenca tabelle
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Lista profili (esempio)
SELECT * FROM "Profile" LIMIT 200;

-- Cancella tutti i post (ATTENZIONE: distruttivo)
DELETE FROM "Post";
```

## Workflow Git (consigliato per il team)
1. Sincronizza `main` e crea un branch feature:

```bash
git checkout main
git pull origin main
git checkout -b feature/<breve-descrizione>
```

2. Lavora sulla feature, poi:

```bash
git add .
git commit -m "feat(<area>): descrizione breve"
git push origin feature/<breve-descrizione>
# Apri una Pull Request verso main
```

3. Prima di aprire PR, mantieni il branch aggiornato:

```bash
git fetch origin
git merge origin/main
```

4. Dopo approvazione, fai merge su `main` e cancella il branch remoto/local.

Commit message convention suggerita: `type(scope): short description` (es. `feat(search): add position filter`).

## Lavorare in team con Supabase/Prisma
- Se tutti usate lo stesso `DATABASE_URL` nel `.env` (es. il DB Supabase del progetto), allora lavorate sullo stesso DB condiviso — le modifiche fatte da uno saranno visibili agli altri.
- Best practice per le migrazioni:
   - Una persona crea la migration e la committa (`pnpm run db:migrate`).
   - Gli altri applicano le migration committate con `pnpm exec prisma migrate deploy`.

## Seed / Clear data (operazioni ripetibili)
Possiamo aggiungere script `prisma/seed.ts` e `prisma/clear-data.ts` per popolare o svuotare il DB. Comandi utili:

```powershell
# Eseguire seed (se presente)
pnpm run db:seed

# Reset dev (ATTENZIONE: cancella dati)
pnpm exec prisma migrate reset
```

## Debug: come verificare la connessione al DB
1. Controlla che `DATABASE_URL` sia impostata nella sessione o in `.env`.

```powershell
$env:DATABASE_URL
```

2. Verifica stato migrazioni e connessione:

```powershell
pnpm exec prisma migrate status --schema=prisma/schema.prisma
```

3. Apri Prisma Studio per ispezionare tabelle e record:

```powershell
pnpm exec prisma studio
```

Se `migrate status` restituisce errori di connessione, verifica la `DATABASE_URL` e che il DB (Supabase) sia attivo.

## Testing locale di una nuova feature (checklist rapida)
1. Crea branch feature e implementa.
2. Aggiorna/crea migration se cambi schema (solo l'owner delle migrazioni la committa):

```powershell
pnpm run db:migrate
```

3. Avvia l'app: `pnpm.cmd dev`.
4. Apri DevTools (F12) → Console / Network per debug client-side.
5. Verifica API con richieste a `/api/*` o usando Postman.
6. Controlla DB con Prisma Studio o Supabase SQL editor.
7. Quando pronto, push & PR.

## Onboarding rapido per i tuoi colleghi
1. Condividi in modo sicuro il file `.env` (password manager o canale privato).
2. Ogni dev esegue:

```powershell
git clone <repo>
pnpm install
# impostare .env
pnpm exec prisma generate
pnpm exec prisma migrate deploy   # se ci sono migrazioni committate
pnpm dev
```

3. Aprire `http://localhost:3000` e `pnpm exec prisma studio` per ispezionare dati.

---

Se vuoi, posso:

- aggiungere `prisma/seed.ts` e `prisma/clear-data.ts` e uno script `db:clear` nel `package.json`; oppure
- applicare subito la migrazione per `Post`/`Follow` e creare file di seed da eseguire sul tuo Supabase (tu esegui `pnpm run db:migrate`/`pnpm run db:seed`).

Dimmi quale preferisci e preparo i file/istruzioni passo‑passo.
