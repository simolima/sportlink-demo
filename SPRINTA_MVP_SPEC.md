# SPRINTA - MVP Master Specification

## 🎨 BRANDING & DESIGN SYSTEM

### Palette Colori
- **Background principale**: `#0A0F32` (blu navy scuro)
- **Colore primario (CTA/Accent)**: `#2341F0` (blu acceso)
- **Card/Sezioni**: `#11152F` o `#141A3A` (leggermente più chiaro del bg)
- **Testi principali**: `#FFFFFF` (bianco puro)
- **Testi secondari**: `#A7B0FF` (grigio-blu chiaro)
- **Divider/Bordi**: `#252A4A` (grigio-blu scuro)
- **Success**: verde (solo per messaggi di successo)
- **Error**: rosso (solo per errori)

### Componenti UI
- **Button Primario**: bg `#2341F0`, text `#FFFFFF`, hover `#3B52F5`
- **Button Secondario**: bg trasparente, border `#2341F0`, text `#2341F0`
- **Card**: bg `#11152F`, bordi arrotondati, shadow sottile
- **Link/Icone attive**: `#2341F2`

---

## 🏠 HOME PAGE - Struttura Definitiva

**Obiettivo**: Mostrare subito ciò che è rilevante per l'utente in base al suo ruolo, sport, profilo e relazioni.

### SEZIONI COMUNI A TUTTI

#### 1️⃣ Banner di Benvenuto + Quick Actions
- "Ciao, {Nome} 👋"
- Sport e ruolo
- Quick actions personalizzate per ruolo:
  - **Player**: "Cerca Opportunità", "Aggiorna Profilo"
  - **Agent**: "Gestisci Assistiti", "Cerca Opportunità"
  - **Coach/Staff**: "Cerca Opportunità", "Aggiorna Profilo"
  - **Club Admin**: "Crea Annuncio", "Gestisci Club"

#### 2️⃣ Annunci Consigliati per Te (TOP 5)
Basati su:
- Sport principale
- Ruolo professionale
- Località (se presente)
- Storico candidature (futuro)

#### 3️⃣ Opportunità Compatibili con il Tuo Profilo
Match quasi perfetti:
- **Player**: annunci che cercano esattamente il suo ruolo/sport
- **Coach**: annunci staff tecnico
- **Agent**: annunci adatti ai suoi assistiti
- **Staff medico/nutrizionisti**: annunci coerenti

#### 4️⃣ Persone che Potresti Conoscere
- Stesso sport
- Stessa regione/città
- Ruoli complementari
- Se Agent: mostra giocatori interessanti
- Se Dirigente: mostra staff/allenatori

#### 5️⃣ Società/Club in Evidenza
- Club del tuo sport
- Club vicini geograficamente
- Club in cerca di persone del tuo ruolo

#### 6️⃣ Le Tue Attività Recenti
Mini-dashboard personale:
- Candidature inviate di recente
- Richieste agenti (pendenti/accettate)
- Messaggi/notifiche importanti
- Se Club: ultime candidature ricevute

#### 7️⃣ Annunci dei Club che Segui
Se segui un club:
- Nuovi annunci pubblicati
- Aggiornamenti funzionali (non social)
- Prove, scouting, ecc.

### SEZIONI SPECIFICHE PER RUOLO

#### 👤 Player
- **8️⃣ Il Mio Agente** (se esiste):
  - Nome, foto
  - Pulsante "Contatta agente"
  - Stato affiliazione
  - Candidature aperte tramite agente

#### 🧑‍💼 Agent
- **8️⃣ I Tuoi Assistiti** (Giocatori affiliati):
  - Nome, ruolo, club attuale
  - Stato candidature
- **9️⃣ Annunci perfetti per i tuoi assistiti**:
  - Opportunità che matchano ruoli/sport dei rappresentati

#### 🏟️ Club Admin / Dirigente
- **8️⃣ Candidature Recenti al Club**:
  - Ultime 5 candidature con "Vedi / Gestisci"
- **9️⃣ Richieste di ingresso nella rosa**:
  - Giocatori che hanno chiesto di entrare
- **🔟 Annunci Attivi del Club**:
  - Stato: aperto, in scadenza, scaduto

---

## 👤 PROFILI UTENTE

### Struttura Base (Tutti i Ruoli)

#### Header Profilo
- Foto profilo
- Nome e cognome
- Ruolo principale
- Sport principale
- Località
- Pulsanti contestuali:
  - Se tu stesso: [Modifica profilo]
  - Se Agent guardando Player: [Richiedi affiliazione]
  - Se Club Admin guardando Player: [Valuta per club]

#### Tabs Principali
Per MVP:
1. **Info** (default)
2. **Esperienze**
3. **Relazioni**
4. **Statistiche/Highlights** (opzionale, può essere placeholder)

---

### 👟 PROFILO PLAYER

#### Header
- Posizione (es. "Attaccante", "Portiere")
- Stato disponibilità:
  - "In cerca di squadra"
  - "Sotto contratto"
  - "Disponibile per provini"

#### TAB 1 - INFO
- Bio breve
- Sport e posizione
- Caratteristiche chiave:
  - Piede preferito (sinistro/destro)
  - Altezza
  - Peso (opzionale)
- Disponibilità:
  - Cerca squadra? Sì/No
  - Disponibile a trasferirsi? (regionale/nazionale/estero)
- Livello attuale (Professionista/Semi-pro/Dilettante/Giovanile)

#### TAB 2 - ESPERIENZE
Timeline:
- Squadra/Club
- Categoria (Primavera, Prima Squadra, U19, ecc.)
- Ruolo/Posizione
- Anno/periodo (da-a)
- Nota breve

#### TAB 3 - STATISTICHE/HIGHLIGHTS
- Sezione Highlights:
  - Link video (YouTube/Vimeo)
  - Descrizioni
- Statistiche (campi manuali):
  - Gol/Assist/Presenze

#### TAB 4 - RELAZIONI
- **Agente**:
  - Se affiliato: card con nome, sport focus, link profilo
  - Se non affiliato: "Nessun agente"
- **Club attuale**:
  - Logo, nome, ruolo nel club
  - Link pagina club
  - Lista club passati
- **Richieste pendenti**:
  - Richieste da agenti con "Accetta/Rifiuta"

---

### 🧑‍💼 PROFILO AGENT

#### Header
- Sport/categorie principali
- Località base

#### TAB 1 - INFO
- Bio
- Sport di competenza
- Categorie target (Giovanili, Serie D-C, ecc.)
- Area geografica primaria
- Certificazioni/Abilitazioni

#### TAB 2 - ESPERIENZE
- Anni di attività
- Club/progetti collaborazioni
- Giocatori rilevanti seguiti

#### TAB 3 - RELAZIONI
- **Giocatori affiliati (Assistiti)**:
  - Card: nome, ruolo, club, sport
  - Link profilo giocatore
- **Affiliazioni pendenti**:
  - Richieste inviate non accettate
- **Candidature inviate per i giocatori**:
  - Player → Annuncio → Club → stato

---

### 🎓 PROFILO COACH/STAFF

(Prep. Atletico, Nutrizionista, Mental Coach, Fisioterapista, ecc.)

#### Header
- Ruolo specifico
- Sport
- Località

#### TAB 1 - INFO
- Bio
- Sport principale
- Ruolo specifico
- Disponibilità:
  - Cerco club?
  - Tipo ingaggio (full-time/part-time/collaborazioni)
- Livello/Esperienza

#### TAB 2 - ESPERIENZE
Timeline:
- Club/squadra
- Categoria
- Ruolo
- Periodo
- Risultati/note

#### TAB 3 - RELAZIONI
- Club attuali (se membro staff)
- Club passati
- Collaborazioni con altri professionisti (futuro)

---

### 🏟️ PROFILO DIRIGENTE/PRESIDENT

#### Header
- Ruolo (President/Director/Sporting Director)
- Sport principale

#### TAB 1 - INFO
- Bio
- Ruolo principale
- Sport
- Area geografica

#### TAB 2 - ESPERIENZE
- Club gestiti in passato:
  - Nome, ruolo, periodo, risultati

#### TAB 3 - RELAZIONI
- Club attuali (card con link)
- Club passati (timeline)

---

## 🏟️ PAGINA CLUB/SOCIETÀ

Entità separata dal profilo utente.

### Header Club
- Logo
- Nome
- Sport (o lista se polisportiva)
- Città/Regione/Paese
- Pulsanti:
  - [Segui club]
  - Se admin: [Gestisci club]

### Tabs Club

#### 1. OVERVIEW (default)
- Descrizione club
- Storia (breve)
- Sport praticati
- Categorie (Prima squadra, U19, U17, femminile)
- Contatti (email, sito, social)

#### 2. ROSA & STAFF
Sezioni:
- **Giocatori**: lista per ruolo/posizione
- **Staff tecnico**: coach, assistenti, preparatori
- **Staff dirigenziale**: presidente, DS, direttori
- Ogni membro cliccabile → profilo utente

#### 3. ANNUNCI
- Lista annunci del club (aperti/chiusi)
- Stato (aperto/scaduto/chiuso)
- Se admin: [Crea annuncio]

#### 4. MEDIA (placeholder futuro)
- Foto generiche
- Link social club

#### 5. GESTIONE (SOLO ADMIN)
Accessibile solo a club admin/manager:
- Membri & ruoli
- Richieste di ingresso
- Candidature annunci
- Impostazioni club

---

## 📢 ANNUNCI & CANDIDATURE

### Chi Può Creare Annunci?
**SOLO** utenti collegati a società/club con:
- Ruolo admin/manager
- Permesso "crea annunci"

Regola MVP:
> Ogni annuncio appartiene a un **Club**.
> Un utente singolo NON può creare annunci.
> Un agente NON crea annunci, ma candida i suoi giocatori.

### Tipi di Annunci (Enum)

```typescript
type AnnouncementType =
  | "PLAYER_SEARCH"      // Cercasi giocatore
  | "COACH_SEARCH"       // Cercasi allenatore
  | "STAFF_SEARCH"       // Cercasi staff tecnico/sanitario
  | "COLLABORATION"      // Collaborazione (mental coach, nutrizionista)
  | "SCOUTING_EVENT";    // Evento scouting/showcase
```

### Struttura Annuncio

```typescript
type AnnouncementStatus = "OPEN" | "CLOSED" | "EXPIRED";

interface Announcement {
  // ✅ OBBLIGATORI
  id: string;
  clubId: string;
  title: string;                    // es. "Cercasi Attaccante Serie D"
  type: AnnouncementType;
  sport: string;
  roleRequired: string;             // es. "Attaccante", "Preparatore Atletico"
  location: string;                 // città/regione/paese
  description: string;
  expiresAt: string;                // max 6 mesi
  createdAt: string;
  status: AnnouncementStatus;
  
  // 🟦 OPZIONALI
  level?: "PRO" | "SEMI_PRO" | "AMATEUR" | "YOUTH";
  contractType?: "FULL_TIME" | "PART_TIME" | "VOLUNTEER" | "INTERNSHIP";
  salaryRange?: string;             // es. "rimborso spese", "stipendio indicativo"
  requirements?: string;            // es. "Esperienza minima 2 anni in serie D"
  ageRange?: string;                // es. "18-23"
  gender?: string;
  trainingLocationDetails?: string; // es. "Allenamenti 3x settimana, sera"
}
```

### Candidature - Struttura

```typescript
type ApplicationStatus = "NEW" | "IN_REVIEW" | "ACCEPTED" | "REJECTED";

interface Application {
  id: string;
  announcementId: string;
  playerId: string;           // o staffId (per MVP usiamo playerId generico)
  agentId?: string;           // presente SOLO se via agente
  message?: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;        // userId del club admin che ha gestito
}
```

### Flusso Candidature

#### Caso A - Player si candida da solo
1. Player apre annuncio `/opportunities/[id]`
2. Clicca "Candidati"
3. Compila messaggio opzionale → conferma
4. Crea Application con:
   - `playerId = currentUser.id`
   - `agentId = undefined`
   - `status = "NEW"`

**UI Club Admin**:
- Lista candidature mostra:
  - Nome giocatore
  - Badge "Candidatura diretta"
  - Azioni: Vedi profilo, Accetta, Rifiuta

#### Caso B - Agente candida suo giocatore
**Prerequisito**: giocatore ha accettato affiliazione con agente

1. Agente apre annuncio → vede "Candidare un giocatore"
2. Seleziona uno dei suoi assistiti (lista Affiliation active)
3. Inserisce messaggio → conferma
4. Crea Application con:
   - `playerId = selectedPlayer.id`
   - `agentId = currentAgent.id`
   - `status = "NEW"`

**UI Club Admin**:
- Lista candidature mostra:
  - Colonna: Giocatore, Agente
  - Badge "Via agente"
  - Azioni: Vedi giocatore, Vedi agente, Contatta agente, Accetta/Rifiuta

**Regola importante**:
> Per ogni (announcement, player) può esistere **UNA SOLA candidatura**.
> Se esiste già, bloccare con errore "Già candidato".

### Cosa Succede quando il Club Accetta?

Per MVP:
1. Club admin clicca "Accetta"
2. `status` → `"ACCEPTED"`
3. Giocatore appare in "candidati accettati"
4. Mostra pulsante **"Aggiungi alla rosa"** che:
   - Crea `ClubMembership` del player con ruolo `Player`

Questo separa:
- **Decisione sportiva** (accettare candidato)
- **Gestione amministrativa** (inserirlo ufficialmente in rosa)

---

## 🗂️ RIEPILOGO IMPLEMENTAZIONE

### Priority 1 - Design System
- [ ] Aggiornare colori globali (bg `#0A0F32`, primary `#2341F0`)
- [ ] Rimuovere tutti i riferimenti al verde (eccetto success)
- [ ] Standardizzare componenti button/card/layout

### Priority 2 - Home Page
- [ ] Implementare banner benvenuto + quick actions per ruolo
- [ ] Sezione annunci consigliati (top 5)
- [ ] Sezione opportunità compatibili
- [ ] Persone che potresti conoscere
- [ ] Club in evidenza
- [ ] Attività recenti
- [ ] Annunci club seguiti
- [ ] Sezioni specifiche per ruolo (agent assistiti, club candidature, ecc.)

### Priority 3 - Profili
- [ ] Profilo Player (4 tabs)
- [ ] Profilo Agent (3 tabs)
- [ ] Profilo Coach/Staff (3 tabs)
- [ ] Profilo Dirigente (3 tabs)
- [ ] Pagina Club (5 tabs)

### Priority 4 - Annunci & Candidature
- [ ] Aggiornare struttura Announcement con tutti i campi
- [ ] Pagina lista annunci con filtri avanzati
- [ ] Pagina dettaglio annuncio
- [ ] Form creazione annuncio (solo club admin)
- [ ] Sistema candidature (player e agent)
- [ ] Gestione candidature (club admin)

---

*Documento generato il 6 Dicembre 2025*
