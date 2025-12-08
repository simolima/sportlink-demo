# SPRINTA - MVP Web Application

## 📋 Panoramica del Progetto

SportLink è una piattaforma web che connette professionisti del mondo sportivo: atleti, allenatori, dirigenti, agenti e società sportive. L'MVP implementa le funzionalità core per permettere agli utenti di creare profili, cercare opportunità e connettersi con altri professionisti.

## ✅ Funzionalità Implementate

### 🔐 Autenticazione & Onboarding
- ✅ **Login Page** (`/login`) - Autenticazione con email e password
- ✅ **Signup Page** (`/create-profile`) - Registrazione con dati completi
- ✅ **Profile Setup** (`/profile-setup`) - Configurazione sport e ruolo professionale
- ✅ Validazione form con campi obbligatori
- ✅ Gestione sessione con localStorage

### 👤 Profili Utente
- ✅ **Visualizzazione Profilo** (`/profile/[id]`) - Pagina dettaglio utente
- ✅ **Modifica Profilo** (`/profile/edit`) - Aggiornamento informazioni
- ✅ Campi profilo: nome, cognome, email, data nascita, bio, avatar, cover
- ✅ **Nuovi campi MVP**:
  - Sport praticato
  - Ruolo professionale (Giocatore, Allenatore, DS, Agente, etc.)
  - Disponibilità (Disponibile, Non disponibile, Valuta proposte)
  - Livello (Professionista, Semi-pro, Dilettante)
  - Club attuale
  - Esperienze professionali
  - Stagioni professionali

### 🔍 Ricerca & Discovery

#### People Search (`/people`)
- ✅ Lista profili con card informative
- ✅ **Filtri avanzati**:
  - Ricerca testuale (nome, bio, ruolo)
  - Filtro per sport
  - Filtro per ruolo professionale
  - Filtro per disponibilità
- ✅ Funzionalità "Follow" per seguire utenti
- ✅ Stati vuoti per nessun risultato

#### Clubs & Societies (`/clubs`)
- ✅ **Lista Società** con filtri per sport e città
- ✅ **Pagina Dettaglio Club** (`/clubs/[id]`) con:
  - Informazioni società (logo, cover, descrizione)
  - Staff tecnico
  - Rosa giocatori
  - Contatti (email, telefono, sito web, social media)
  - Numero posizioni aperte
  - Pulsante "Segui" e "Contatta"
- ✅ 6 club di esempio (AC Milan, Inter, Juventus, Olimpia Milano, Virtus Bologna, Roma Nuoto)

#### Opportunities (`/jobs`)
- ✅ Lista annunci/opportunità di lavoro
- ✅ Filtri per categoria (Giocatore, Coach, Staff, Altro)
- ✅ Form creazione nuove opportunità
- ✅ Funzionalità candidatura (mock)
- ✅ Gestione applicazioni per proprietari annunci

### 🏠 Dashboard & Navigation
- ✅ **Dashboard/Home** (`/home`) - Feed di post e aggiornamenti
- ✅ **Navbar** con link a tutte le sezioni principali:
  - Feed
  - Scopri (People)
  - Società
  - Opportunità
  - Messaggi
  - Profilo
- ✅ Sistema di notifiche messaggi non letti
- ✅ Layout responsive mobile/desktop

### 💬 Features Sociali
- ✅ **Feed Posts** - Pubblicazione e visualizzazione post
- ✅ **Commenti** - Sistema commenti sui post
- ✅ **Likes** - Sistema like sui post
- ✅ **Follow/Unfollow** - Seguire altri utenti
- ✅ **Messaggi** (`/messages`) - Chat 1-to-1 tra utenti
- ✅ Contatore messaggi non letti

## 🗂️ Struttura File System

```
sportlink-demo/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── athletes/
│   │   ├── clubs/               ✨ NEW - API per società
│   │   ├── comments/
│   │   ├── follows/
│   │   ├── jobs/
│   │   ├── likes/
│   │   ├── messages/
│   │   ├── posts/
│   │   ├── upload/
│   │   └── users/
│   ├── clubs/                    ✨ NEW - Pagine società
│   │   ├── page.tsx             # Lista società
│   │   └── [id]/page.tsx        # Dettaglio società
│   ├── create-profile/
│   │   └── page.tsx             # Registrazione utente
│   ├── home/
│   │   └── page.tsx             # Dashboard/Feed
│   ├── jobs/
│   │   └── page.tsx             # Opportunità di lavoro
│   ├── login/
│   │   └── page.tsx             # Login
│   ├── messages/
│   │   ├── page.tsx             # Lista conversazioni
│   │   └── [peerId]/page.tsx   # Chat 1-to-1
│   ├── people/
│   │   └── page.tsx             ✨ UPDATED - Ricerca con filtri
│   ├── profile/
│   │   ├── page.tsx             # Profilo utente corrente
│   │   ├── [id]/page.tsx        # Profilo pubblico
│   │   └── edit/page.tsx        # Modifica profilo
│   ├── profile-setup/            ✨ NEW
│   │   └── page.tsx             # Setup sport e ruolo
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing page
├── components/                   # Componenti React
│   ├── avatar.tsx
│   ├── comment-composer.tsx
│   ├── comment-list.tsx
│   ├── feed.tsx
│   ├── follow-button.tsx
│   ├── login-card.tsx
│   ├── navbar.tsx               ✨ UPDATED - Link Società
│   ├── post-card.tsx
│   ├── post-composer.tsx
│   ├── profile-*.tsx
│   └── ...
├── data/                         # Mock Data (JSON files)
│   ├── clubs.json               ✨ NEW - Dati società
│   ├── comments.json
│   ├── follows.json
│   ├── jobs.json
│   ├── likes.json
│   ├── messages.json
│   ├── posts.json
│   └── users.json
├── lib/                          # Utilities & Services
│   ├── types.ts                 ✨ UPDATED - Nuovi tipi
│   ├── prisma.ts
│   ├── supabase-browser.ts
│   ├── upload-service.ts
│   └── fetcher.ts
├── mobile/                       # React Native App (separata)
├── public/
│   └── avatars/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## 🎨 Tipi TypeScript Principali

### Nuovi Tipi Implementati

```typescript
// Sport disponibili
export const SPORTS = [
  'Calcio', 'Basket', 'Pallavolo', 'Rugby', 'Tennis', 'Nuoto', 
  'Atletica', 'Ciclismo', 'Boxe', 'MMA', 'Scherma', 'Golf',
  'Hockey', 'Baseball', 'Football Americano', 'Altro'
] as const;

export type Sport = typeof SPORTS[number];

// Ruoli professionali
export const PROFESSIONAL_ROLES = [
  'Giocatore',
  'Allenatore',
  'Agente',
  'Direttore Sportivo',
  'Preparatore Atletico',
  'Nutrizionista',
  'Mental Coach',
  'Talent Scout',
  'Fisioterapista/Massaggiatore',
  'Presidente',
  'Dirigente',
  'Nessuno'
] as const;

export type ProfessionalRole = typeof PROFESSIONAL_ROLES[number];

// User esteso con nuovi campi
export type User = {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  sport?: Sport;                  // NEW
  professionalRole?: ProfessionalRole;  // NEW
  availability?: 'Disponibile' | 'Non disponibile' | 'Valuta proposte';  // NEW
  level?: string;                 // NEW
  currentClub?: string;           // NEW
  // ... altri campi
};

// Opportunity/Announcement
export type Opportunity = {
  id: number | string;
  title: string;
  sport: Sport;
  roleRequired: ProfessionalRole;
  category: 'player' | 'coach' | 'staff' | 'other';
  description: string;
  location: string;
  clubName?: string;
  // ... altri campi
};

// Club/Society
export type Club = {
  id: number | string;
  name: string;
  sport: Sport;
  city: string;
  country: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  staff?: Array<{ userId: number | string; role: string; name: string }>;
  roster?: Array<{ userId: number | string; position: string; name: string }>;
  openPositions?: number;
  followers?: number;
  verified?: boolean;
  // ... contatti e social
};
```

## 🚀 Come Avviare il Progetto

### Prerequisiti
- Node.js 18+ installato
- pnpm installato (`npm install -g pnpm`)

### Setup Iniziale

```bash
# 1. Naviga nella directory del progetto web
cd sportlink-demo

# 2. Installa le dipendenze (se non già fatto)
pnpm install

# 3. Avvia il server di sviluppo
pnpm dev

# L'app sarà disponibile su http://localhost:3000
```

### Comandi Disponibili

```bash
pnpm dev          # Avvia server Next.js (porta 3000)
pnpm dev:web      # Alias per pnpm dev
pnpm dev:mobile   # Avvia app React Native (separata)
pnpm build        # Build produzione
pnpm start        # Avvia server produzione
pnpm lint         # Linting
```

## 🧪 Testing del Flusso Completo

### 1. Registrazione Nuovo Utente
1. Vai a `/create-profile`
2. Compila il form con: nome, cognome, email, password, data nascita
3. (Opzionale) Carica avatar e cover
4. Clicca "Crea Profilo"
5. Verrai reindirizzato a `/profile-setup`

### 2. Setup Profilo (Sport & Ruolo)
1. Seleziona uno **Sport** dal dropdown
2. Seleziona un **Ruolo Professionale**
3. (Opzionale) Indica disponibilità, livello, club attuale
4. Clicca "Completa Profilo" o "Salta per ora"
5. Verrai reindirizzato alla dashboard (`/home`)

### 3. Esplora Profili
1. Vai a `/people`
2. Usa i filtri per:
   - Cercare per nome o bio
   - Filtrare per sport (es. "Calcio")
   - Filtrare per ruolo (es. "Giocatore")
   - Filtrare per disponibilità
3. Clicca su un profilo per vedere i dettagli
4. Clicca "Segui" per seguire l'utente

### 4. Esplora Società
1. Vai a `/clubs`
2. Usa i filtri per sport o città
3. Clicca su una società per vedere dettagli
4. Visualizza staff, roster, contatti
5. Clicca "Segui" o "Contatta"

### 5. Cerca Opportunità
1. Vai a `/jobs`
2. Filtra per categoria
3. Visualizza annunci disponibili
4. Clicca "Candidati" per applicare (mock)

### 6. Interazioni Sociali
1. Vai a `/home` per vedere il feed
2. Pubblica un nuovo post
3. Like e commenta altri post
4. Vai a `/messages` per chattare con altri utenti

## 🎯 Criteri di Completamento MVP

### ✅ Completati
- [x] Registrazione e login utente
- [x] Profilo base con sport + ruolo
- [x] Dashboard + navigazione funzionante
- [x] Ricerca profili con filtri (sport, ruolo, disponibilità)
- [x] Ricerca opportunità con filtri
- [x] Pagine società con lista e dettaglio
- [x] Visualizzazione profili utenti e club
- [x] Funzionalità "candidati/contatta" (mock)
- [x] UI responsive mobile/desktop
- [x] Stati vuoti gestiti
- [x] Validazione form

### 🔄 Mock vs Real Backend
Attualmente l'app usa **mock data** (file JSON in `/data`). Le API routes leggono/scrivono da questi file.

Per passare a un backend reale:
1. Il database Prisma è già configurato (`prisma/schema.prisma`)
2. Sostituire le API routes per usare Prisma invece di file JSON
3. Migrare i dati mock nel database

## 📦 Dipendenze Principali

```json
{
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "@heroicons/react": "^2.0.18",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.56.2",
    "framer-motion": "^12.23.24",
    "tailwindcss": "^3.4.3"
  }
}
```

## 🎨 Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Icons**: Heroicons
- **State Management**: React Context + localStorage
- **Database**: Prisma ORM (configurato, non attivo)
- **Storage**: Supabase (per upload avatar/cover)
- **UI Components**: Custom components React

## 🔧 Configurazione Ambiente

### File `.env.local` (se necessario)

```env
# Supabase (per upload file)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (se usi Prisma)
DATABASE_URL="postgresql://..."
```

## 📝 Note Implementative

### Autenticazione
- Attualmente usa localStorage per salvare `currentUserId`
- Password non sono criptate (mock data)
- Per produzione: implementare JWT, bcrypt, sessioni server

### Upload File
- Avatar e cover usano Supabase Storage
- Validazione: max 5MB, solo immagini
- Fallback a placeholder se upload fallisce

### Routing
- Next.js App Router con file-based routing
- Route dinamiche: `[id]` per profili e club
- Protected routes: redirect a `/login` se non autenticati

### Mobile
- La cartella `/mobile` contiene un'app React Native **completamente separata**
- Usa Expo per development
- Condivide gli stessi endpoint API del web app

## 🚧 TODO / Funzionalità Future

- [ ] Implementare OAuth (Google, Facebook)
- [ ] Notifiche real-time (WebSocket)
- [ ] Chat di gruppo
- [ ] Sistema di matching automatico
- [ ] Analytics e statistiche
- [ ] Export profilo PDF
- [ ] Sistema di review/rating
- [ ] Pagamenti integrati per servizi premium
- [ ] Multi-lingua (i18n)
- [ ] Dark mode

## 🐛 Known Issues

- La funzionalità "candidati" è mock (non salva applicazioni realmente)
- Il sistema follow non aggiorna il contatore in real-time
- Le notifiche messaggi potrebbero non aggiornarsi istantaneamente
- Upload file grande potrebbe timeout

## 📞 Supporto

Per problemi o domande:
1. Verifica che tutte le dipendenze siano installate: `pnpm install`
2. Verifica che la porta 3000 sia libera
3. Controlla la console browser per errori
4. Verifica che i file JSON in `/data` siano validi

## 📄 Licenza

Progetto interno - Tutti i diritti riservati

---

**Ultimo aggiornamento**: Dicembre 2025
**Versione**: MVP 1.0
