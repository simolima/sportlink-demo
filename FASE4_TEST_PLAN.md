# 🧪 FASE 4 - Test Plan Completo

**Data**: 6 Dicembre 2025  
**Scope**: Club Management & Announcements (Opportunities)  
**Status**: 🔄 In Testing

---

## 📋 Prerequisiti

### Account di Test
- **Player Account**: Qualsiasi giocatore (es. nuova registrazione)
- **Admin Account**: `marco.rossi@sprinta.com` (Director at Casarile FC)
  - Email: `marco.rossi@sprinta.com`
  - Password: `demo123`
  - Role: `Director` (Admin di club)
  - Club ID: `1765053528599` (Casarile FC)

### Dati Fixture
```json
Clubs:
- ID: 1765053528599 (Casarile FC)
  - Sport: Calcio
  - City: Milano
  - Members: 1 (marco.rossi as Admin)

Announcements:
- ID: 1765053656807 (Cerco difensore centrale)
  - Club ID: 1765053528599
  - Type: Player Search
  - Sport: Calcio
  - Expires: 2025-12-31 (Attivo)
  - Status: isActive=true
```

---

## 🎯 Test Cases

### SEZIONE 1: Club List & Detail

#### TEST 1.1 - Club List Page (`/clubs`)
**Scenario**: Aprire la pagina di lista club come qualsiasi utente

**Steps**:
1. Accedi a `/clubs`
2. Aspetta caricamento lista
3. Verifica card:
   - ✅ Logo (placeholder verde se null)
   - ✅ Nome club
   - ✅ Sport badge
   - ✅ City badge
   - ✅ Description (max 2 righe)
   - ✅ Followers count
   - ✅ Members count
4. Click su card → `/clubs/[id]`

**Expected**: Card visualizzate correttamente, click funziona

---

#### TEST 1.2 - Club Detail - Tab Info
**Scenario**: Visualizzare info dettagliate di un club

**Steps**:
1. Vai a `/clubs/1765053528599` (Casarile FC)
2. Verifica hero section:
   - ✅ Cover image (o placeholder)
   - ✅ Logo circolare
   - ✅ Nome club
   - ✅ Badge "Verificato" (se verified=true)
3. Verifica info section:
   - ✅ Sport
   - ✅ City
   - ✅ Description
   - ✅ Contact info (email, phone, website)
4. Verifica tab navigation:
   - ✅ Tab "Info" (active)
   - ✅ Tab "Opportunità"
   - ✅ Tab "Membri" (solo se admin loggato)

**Expected**: Info visualizzate, tab navigation funziona

---

#### TEST 1.3 - Club Detail - Tab Opportunità
**Scenario**: Visualizzare annunci del club

**Steps**:
1. Vai a `/clubs/1765053528599`
2. Click tab "Opportunità"
3. Verifica lista:
   - ✅ Card annuncio con Briefcase icon
   - ✅ Titolo annuncio
   - ✅ Type badge (Player Search)
   - ✅ Sport, Ruolo, Description
   - ✅ Scadenza visibile

**Expected**: Annuncio "Cerco difensore centrale" visualizzato

---

#### TEST 1.4 - Club Detail - Tab Membri (Admin Only)
**Scenario**: Verificare tab membri visibile solo ad admin

**Steps A** (Come Player):
1. Accedi con player account
2. Vai a `/clubs/1765053528599`
3. Verifica: ✅ Tab "Membri" NON VISIBLE

**Steps B** (Come Admin):
1. Accedi con `marco.rossi@sprinta.com`
2. Vai a `/clubs/1765053528599`
3. Verifica: ✅ Tab "Membri" VISIBLE
4. Click tab "Membri"
5. Verifica lista:
   - ✅ Membri attivi (marco.rossi con ruolo "Admin")
   - ✅ Sezione "Richieste di ingresso" (vuota ora)
   - ✅ Bottoni Accetta/Rifiuta (se richieste pendenti)

**Expected**: Tab visibile solo ad admin, mostra membri e richieste

---

### SEZIONE 2: Create Club

#### TEST 2.1 - Create Club Form
**Scenario**: Creare un nuovo club

**Steps**:
1. Accedi con player account (es. account nuovo)
2. Vai a `/clubs`
3. Clicca "Crea Club" (visibile per tutti)
4. Compila form:
   - Nome: "Test FC"
   - Sport: "Calcio"
   - City: "Roma"
   - Description: "Un club di test"
   - Website: "www.test.com"
   - Verified: false
5. Submit

**Expected**:
- ✅ Club creato con ID univoco
- ✅ Creator diventa automaticamente **Admin**
- ✅ club-memberships entry creata (creator -> Admin)
- ✅ Redirect a `/clubs/[newId]`
- ✅ JSON `clubs.json` aggiornato
- ✅ JSON `club-memberships.json` aggiornato

---

### SEZIONE 3: Gestione Membri (Admin)

#### TEST 3.1 - Join Request Flow
**Scenario**: Player richiede di unirsi a un club

**Steps**:
1. Accedi con player account
2. Vai a `/clubs/1765053528599`
3. Click bottone "Richiedi di unirti"
4. Compila form richiesta (optional message)
5. Submit

**Expected**:
- ✅ Richiesta salvata in `club-join-requests.json`
- ✅ Status = "pending"
- ✅ Toast notifica "Richiesta inviata"
- ✅ Bottone cambia a "Richiesta in sospeso" (disabled)

---

#### TEST 3.2 - Accept/Reject Request (Admin)
**Scenario**: Admin accetta/rifiuta richieste di ingresso

**Steps A** (Accept):
1. Accedi con `marco.rossi@sprinta.com`
2. Vai a `/clubs/1765053528599` → Tab "Membri"
3. Sezione "Richieste di ingresso" mostra richiesta player
4. Click "Accetta"

**Expected**:
- ✅ Richiesta status → "accepted"
- ✅ club-membership creata per player
- ✅ Player compare in lista "Membri" del club
- ✅ Toast notifica success

**Steps B** (Reject):
1. Stessi step ma click "Rifiuta"

**Expected**:
- ✅ Richiesta status → "rejected"
- ✅ Nessun membership creato
- ✅ Richiesta scompare da lista

---

### SEZIONE 4: Annunci / Opportunities

#### TEST 4.1 - Create Announcement (Admin Only)
**Scenario**: Admin crea una nuova opportunità nel club

**Steps**:
1. Accedi con `marco.rossi@sprinta.com`
2. Vai a `/clubs/1765053528599` → Tab "Opportunità"
3. Click "Crea Opportunità"
4. Compila form:
   - Titolo: "Striker cercasi"
   - Type: "Player Search"
   - Sport: "Calcio"
   - Ruolo: "Player"
   - Position: "ST"
   - Location: "Milano"
   - City: "Milano"
   - Description: "Cerchiamo una punta veloce"
   - Level: "Professional"
   - Contract: "Full-time"
   - Salary: "15k-20k"
   - Expiry: 2025-12-31
5. Submit

**Expected**:
- ✅ Annuncio salvato in `announcements.json`
- ✅ clubId matchato correttamente
- ✅ isActive = true
- ✅ Appare immediatamente in tab "Opportunità"
- ✅ Appare in `/opportunities` (dopo refresh)

---

#### TEST 4.2 - Create Form Validation
**Scenario**: Validare che date passate non siano accettate

**Steps**:
1. Apri form creazione annuncio
2. Clicca input data scadenza
3. Verifica: ✅ Date picker blocca date passate
4. Prova selezionare data passata: ✅ Non selezionabile
5. Testo di aiuto visible: "La data deve essere nel futuro"

**Expected**: Input HTML ha `min="[today]"` e validazione client-side

---

#### TEST 4.3 - Opportunities List Page (`/opportunities`)
**Scenario**: Visualizzare tutti gli annunci attivi con filtri

**Steps**:
1. Accedi con qualsiasi account
2. Vai a `/opportunities`
3. Verifica lista:
   - ✅ Card annuncio con club logo
   - ✅ Titolo, tipo, sport, livello
   - ✅ Location, scadenza
   - ✅ Applicationscount
4. Verifica filtri:
   - ✅ Search box
   - ✅ Sport dropdown (Calcio, Basket, etc.)
   - ✅ Type dropdown
   - ✅ Level dropdown
5. Test filtri:
   - Seleziona Sport="Calcio" → mostra solo Calcio
   - Seleziona Type="Player Search" → mostra solo Player Search
   - Type nel search "difensore" → filtra per title/description

**Expected**: Filtri funzionano, risultati aggiornano dinamicamente

---

#### TEST 4.4 - Apply for Opportunity
**Scenario**: Player candidarsi a un'opportunità

**Steps**:
1. Accedi con player account
2. Vai a `/opportunities`
3. Trova annuncio "Cerco difensore centrale"
4. Click "Candidati"
5. Verifica:
   - ✅ Toast "Candidatura inviata"
   - ✅ Bottone cambia a "Già candidato" (disabled)

**Expected**:
- ✅ Application salvata in `applications.json`
- ✅ Status = "pending"
- ✅ announcementId + playerId matchati
- ✅ Non puoi candidarti 2 volte

---

### SEZIONE 5: Permessi (Non-Admin)

#### TEST 5.1 - Player cannot create Announcements
**Scenario**: Verificare che player non vede form creazione annunci

**Steps**:
1. Accedi con player account
2. Vai a `/clubs/1765053528599`
3. Tab "Opportunità"
4. Verifica: ✅ Bottone "Crea Opportunità" NON VISIBLE
5. Form creazione: ✅ NON VISIBLE

**Expected**: Solo admin vede bottone e form

---

#### TEST 5.2 - Player cannot access Members Tab
**Scenario**: Verificare che player non vede tab Membri

**Steps**:
1. Accedi con player account
2. Vai a `/clubs/1765053528599`
3. Verifica: ✅ Tab "Membri" NON VISIBLE
4. Tenta accesso diretto: nessun endpoint visibile

**Expected**: Tab nascosto per non-admin

---

### SEZIONE 6: JSON Data Consistency

#### TEST 6.1 - Type Consistency
**Verificare**: Tutti gli ID numerici nei JSON sono **numeri**, non stringhe

**Checklist**:
- ✅ clubs.json: `id` è numero
- ✅ announcements.json: `id`, `clubId`, `createdBy` sono numeri
- ✅ club-memberships.json: `id`, `userId`, `clubId` sono numeri
- ✅ club-join-requests.json: `id`, `userId`, `clubId`, `createdBy` sono numeri
- ✅ applications.json: `id`, `announcementId`, `playerId` sono numeri

**Command**:
```bash
# Verifica se API non converte a stringa
curl -s http://localhost:3000/api/clubs | jq '.[] | type(.id)'
```

**Expected**: Tutti gli ID sono "number" nel JSON output

---

#### TEST 6.2 - Club ID Matching
**Verificare**: Quando un player accede club detail, tutte le relazioni funzionano

**Steps**:
1. Vai a `/clubs/1765053528599`
2. Apri DevTools → Network
3. Osserva fetch:
   - ✅ `/api/clubs` → returns array
   - ✅ `/api/club-memberships?clubId=1765053528599` → members list
   - ✅ `/api/club-join-requests?clubId=1765053528599&status=pending` → pending requests
   - ✅ `/api/announcements?clubId=1765053528599` → club announcements

**Expected**: Tutti i fetch usano clubId come numero, matching funziona

---

#### TEST 6.3 - Announcement Filtering
**Verificare**: API filtra correttamente per expiryDate

**Steps**:
1. Vai a `/opportunities`
2. Check Network → `/api/announcements?activeOnly=true`
3. Response include solo:
   - ✅ isActive = true
   - ✅ expiryDate >= today
4. Non include:
   - ❌ isActive = false
   - ❌ expiryDate < today

**Expected**: Filtro funziona, non vedi annunci scaduti

---

## ✅ Test Execution Matrix

| #   | Test Case | Player | Admin | Status | Notes |
|-----|-----------|--------|-------|--------|-------|
| 1.1 | Club List | ✅     | ✅    | 🔄    |       |
| 1.2 | Club Detail Info | ✅ | ✅    | 🔄    |       |
| 1.3 | Club Tab Opportunities | ✅ | ✅ | 🔄 |       |
| 1.4 | Club Tab Members (Admin) | ❌ | ✅ | 🔄 |       |
| 2.1 | Create Club | ✅ | ✅    | 🔄    |       |
| 3.1 | Join Request | ✅ | N/A  | 🔄    |       |
| 3.2 | Accept/Reject | N/A | ✅   | 🔄    |       |
| 4.1 | Create Announcement | ❌ | ✅ | 🔄 |       |
| 4.2 | Form Validation | ✅ | ✅    | 🔄    |       |
| 4.3 | Opportunities List | ✅ | ✅    | 🔄    |       |
| 4.4 | Apply for Opportunity | ✅ | ✅ | 🔄 |       |
| 5.1 | No Create button (Player) | ✅ | N/A | 🔄 |       |
| 5.2 | No Members tab (Player) | ✅ | N/A | 🔄 |       |
| 6.1 | JSON Type Consistency | ✅ | ✅    | 🔄    |       |
| 6.2 | Club ID Matching | ✅ | ✅    | 🔄    |       |
| 6.3 | Announcement Filtering | ✅ | ✅    | 🔄    |       |

---

## 🐛 Troubleshooting

### Annuncio non appare in `/opportunities`
**Diagnosi**:
1. Controlla console browser (F12) → Network tab
2. Verifica API response: `/api/announcements?activeOnly=true`
3. Controlla JSON:
   - `isActive` = true?
   - `expiryDate` > today?
   - `clubId` match club?

**Fix**:
- Aggiorna `expiryDate` a data futura
- Assicurati `isActive: true`
- Verifica clubId è numero, non stringa

---

### Tab "Membri" non appare
**Diagnosi**:
1. Accedi come club admin
2. Controlla localStorage: `currentUserId`
3. Verifica API: `/api/club-memberships?clubId=[id]`
4. Controlla se utente ha `role: "Admin"`

**Fix**:
- Accertati che creator è admin nel membership
- Verifica club-memberships.json ha record admin corretto

---

### Form validazione data non funziona
**Diagnosi**:
1. Apri DevTools → Inspector
2. Cerca input date
3. Verifica `min` attribute

**Fix**:
```tsx
min={new Date().toISOString().split('T')[0]}
```

---

## 📊 Completion Checklist

- [ ] Test 1.1 - 1.4: Club List & Detail ✅
- [ ] Test 2.1: Create Club ✅
- [ ] Test 3.1 - 3.2: Membership Management ✅
- [ ] Test 4.1 - 4.4: Announcements/Opportunities ✅
- [ ] Test 5.1 - 5.2: Permission Checks ✅
- [ ] Test 6.1 - 6.3: JSON Consistency ✅
- [ ] All JSON files valid ✅
- [ ] No console errors ✅
- [ ] Responsive design OK ✅

---

**Status**: 🟡 In Progress  
**Last Updated**: 6 Dec 2025  
**Next**: Execute tests and document results
