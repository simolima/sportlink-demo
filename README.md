# Sportlink Demo

## Descrizione  
Demo dell’applicazione Sportlink (MVP) per mettere in contatto sportivi amatoriali/giovani adulti in base a sport, livello e posizione.

## Requisiti  
- Node.js (versione consigliata: v20+)  
- pnpm (o npm/yarn se preferite)  
- Credenziali del backend (es. Supabase o altro)  
- File `.env` con variabili di ambiente corrette

## Setup (passo-passo)  
1. Clona la repository:  
   ```bash
   git clone https://github.com/simolima/sportlink-demo.git
   cd sportlink-demo

Installa le dipendenze:


pnpm install

Crea il file .env copiando l’esempio:


cp .env.example .env

e inserisci i valori per:

DATABASE_URL

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY
(aggiungi altre variabili se previste)

Esegui le migrazioni (se applicabili):


pnpm db:migrate
(Facoltativo) Esegui lo seed del database:


pnpm db:seed

# Avvia il server in sviluppo:


pnpm dev
Visita http://localhost:3000 per vedere l’app in azione.

Per il deploy (es. su Vercel):

Pusha il codice su GitHub.

Crea un progetto su Vercel, importa la repo (Next.js dovrebbe essere rilevato automaticamente).

Imposta le stesse variabili d’ambiente sulla piattaforma di deploy.

Configura il branch main come produzione.

# Flusso di lavoro Git per nuove feature/bugfix

# Creare un nuovo branch

git checkout main
git pull origin main
git checkout -b feature/<descrizione-breve>

Oppure per bugfix:


git checkout -b fix/<descrizione-breve>

# Lavorare e commitare


git status
git add <file1> <file2>
git commit -m "feat(<area>): descrizione breve"

Esempio messaggio:

pgsql
feat(search): add filters by sport and level
Push e Pull Request


git push origin <nome-branch>
Apri una Pull Request verso main.

Descrivi cosa fa la feature/bugfix, perché è necessaria e quali file modifica.

Assegna revisori.

Dopo approvazione, esegui il merge.

# Mantenere il branch aggiornato

git checkout <tuo-branch>
git fetch origin
git merge origin/main
git push origin <tuo-branch>

# risolvi conflitti se necessario:

git add <file-risolti>
git rebase --continue
git push -f origin <tuo-branch>

# Unire il branch su main

git checkout main
git pull origin main
git merge --no-ff <nome-branch>
git push origin main

# Dopo il merge:

git branch -d <nome-branch>
git push origin --delete <nome-branch>

Commit conventions suggerite
feat: per nuove funzionalità

fix: per bugfix

docs: per documentazione

chore: per compiti generici (es. aggiornamento dipendenze)

refactor: per refactoring
Usa tempo presente, descrivi cosa fa il commit.

# Conclusione
Seguendo questi step il progetto resterà ben organizzato, il branch main sempre deployabile, e il flusso di lavoro chiaro per tutto il team.