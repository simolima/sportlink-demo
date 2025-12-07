# ⚡ FASE 4 - Quick Test Checklist

Esegui questi test in sequenza. Tutti devono ✅ passare.

---

## 🚀 SETUP (2 min)

1. **Assicurati dev server in esecuzione**:
   ```bash
   pnpm dev
   ```

2. **Apri 2 browser tab**:
   - Tab A: **Player account** (crea uno nuovo se necessario)
   - Tab B: **Admin account** `marco.rossi@sprinta.com` / `demo123`

3. **Verifica fixture data**:
   - Club: Casarile FC (ID: `1765053528599`)
   - Announcement: "Cerco difensore centrale"

---

## ✅ TEST SEQUENCE

### A. CLUB MANAGEMENT (10 min)

**A1. Club List** (Player Tab)
```
1. Vai a /clubs
2. Vedi card "Casarile FC" con:
   - Logo (verde se null) ✅
   - Nome, Sport (Calcio) ✅
   - City badge ✅
   - Followers/Members count ✅
3. Click card → /clubs/1765053528599 ✅
```

**A2. Club Detail - Tab Info** (Player Tab)
```
1. Sei in /clubs/1765053528599
2. Vedi:
   - Cover image (or placeholder) ✅
   - Logo circolare ✅
   - Nome "Casarile FC" ✅
   - Sport, City, Description ✅
3. Verifica tab navigation:
   - Info (active) ✅
   - Opportunità ✅
   - Membri (NON visibile per player) ✅
```

**A3. Club Detail - Tab Opportunità** (Player Tab)
```
1. Click tab "Opportunità"
2. Vedi annuncio:
   - Titolo "Cerco difensore centrale" ✅
   - Briefcase icon ✅
   - Type "Player Search" ✅
   - Sport "Calcio", Ruolo "Player" ✅
   - Description visible ✅
   - Expiry: 2025-12-31 ✅
```

**A4. Club Detail - Members Tab Hidden** (Player Tab)
```
1. Guarda i 3 tab:
   - Info ✅
   - Opportunità ✅
   - Membri (HIDDEN) ✅ ← non dovresti vederlo
```

**A5. Club Detail - Members Tab Visible** (Admin Tab)
```
1. Login con marco.rossi@sprinta.com
2. Vai a /clubs/1765053528599
3. Vedi 3 tab:
   - Info ✅
   - Opportunità ✅
   - Membri (VISIBLE) ✅ ← lo vedi
4. Click tab "Membri"
5. Vedi:
   - Lista con "Marco Rossi" (Admin) ✅
   - Sezione "Richieste di ingresso" (vuota ora) ✅
```

**A6. Create Club** (Player Tab)
```
1. Vai a /clubs
2. Click "Crea Club" ✅ (visibile per tutti)
3. Compila form:
   - Nome: "My Test FC"
   - Sport: "Basket"
   - City: "Torino"
   - Description: "Test club"
4. Submit
5. Verifica:
   - Nuovo club creato ✅
   - Reindirizzato a /clubs/[newId] ✅
   - Apri DevTools → controllo clubs.json ha nuovo entry ✅
```

---

### B. MEMBERSHIP & PERMISSIONS (8 min)

**B1. Join Request** (Player Tab - Casarile FC)
```
1. Torna a /clubs/1765053528599 (Casarile FC)
2. Vedi bottone "Richiedi di unirti" ✅
3. Click → compila richiesta:
   - Message: "Voglio giocare" (optional)
   - Submit
4. Toast notifica "Richiesta inviata" ✅
5. Bottone diventa "Richiesta in sospeso" (disabled) ✅
```

**B2. Accept Request** (Admin Tab - Casarile FC)
```
1. Vai a /clubs/1765053528599 → Tab "Membri"
2. Sezione "Richieste di ingresso" mostra richiesta player ✅
3. Click "Accetta"
4. Verifica:
   - Richiesta scompare ✅
   - Player appare in lista "Membri" ✅
   - Toast success ✅
   - Controlla club-join-requests.json → status="accepted" ✅
   - Controlla club-memberships.json → nuovo entry per player ✅
```

---

### C. ANNOUNCEMENTS / OPPORTUNITIES (12 min)

**C1. Crea Announcement** (Admin Tab - Casarile FC)
```
1. Vai a /clubs/1765053528599 → Tab "Opportunità"
2. Click "Crea Opportunità" ✅
3. Compila form:
   - Titolo: "Ala cercasi"
   - Type: "Player Search"
   - Sport: "Calcio"
   - Ruolo: "Player"
   - Position: "LW"
   - Location: "Milano"
   - City: "Milano"
   - Description: "Cerchiamo un'ala veloce"
   - Level: "Amateur"
   - Contract: "Volunteer"
   - Salary: "gratis"
   - Expiry: 2025-12-31 (data picker deve avere min=today) ✅
4. Submit
5. Verifica:
   - Annuncio appare in tab ✅
   - Toast "Annuncio creato" ✅
   - Controlla announcements.json ha nuovo entry ✅
```

**C2. Date Validation** (Admin Tab - Form)
```
1. Click "Crea Opportunità"
2. Scroll a "Scadenza"
3. Click input data
4. Prova selezionare data passata:
   - Data passata NON selezionabile ✅
   - Vedi testo "La data deve essere nel futuro" ✅
5. Seleziona data futura (es. 2025-12-25) ✅
```

**C3. Opportunities Page - List & Filters** (Player Tab)
```
1. Vai a /opportunities
2. Vedi liste di annunci:
   - "Cerco difensore centrale" (Casarile FC) ✅
   - "Ala cercasi" (Casarile FC) ✅
3. Verifica filtri:
   - Search box presente ✅
   - Sport dropdown (Calcio, Basket, etc.) ✅
   - Type dropdown (Player Search, Club Offer, etc.) ✅
   - Level dropdown (Amateur, Professional, etc.) ✅
4. Test filtri:
   - Seleziona Sport="Calcio" → mostra solo Calcio ✅
   - Seleziona Type="Player Search" → mostra solo quel tipo ✅
   - Digita "difensore" in search → filtra ✅
   - Reset filtri → tutti gli annunci torna ✅
```

**C4. Apply for Opportunity** (Player Tab)
```
1. Rimani in /opportunities
2. Trova "Cerco difensore centrale"
3. Click "Candidati"
4. Verifica:
   - Toast "Candidatura inviata!" ✅
   - Bottone diventa "Candidato" (disabled) ✅
   - Controlla applications.json ha nuovo entry ✅
5. Prova candidarti di nuovo:
   - Toast "Hai già inviato una candidatura" ✅
```

---

### D. PERMISSION CHECKS (5 min)

**D1. Player non vede Create Announcement** (Player Tab - Casarile FC)
```
1. Vai a /clubs/1765053528599 → Tab "Opportunità"
2. Bottone "Crea Opportunità" NON VISIBLE ✅
3. Form creazione NON VISIBLE ✅
4. Vedi solo lista annunci ✅
```

**D2. Player non vede Members Tab** (Player Tab)
```
1. Vai a /clubs/1765053528599
2. Verifica 3 tab: Info, Opportunità, (NO Membri) ✅
3. Tab "Membri" completamente assente ✅
```

**D3. Admin vede tutte le features** (Admin Tab)
```
1. Vai a /clubs/1765053528599
2. Verifica 4 tab: Info, Opportunità, Membri, ✅
3. Tab "Membri" VISIBLE ✅
4. Bottone "Crea Opportunità" VISIBLE ✅
5. Form creazione annunci VISIBLE ✅
```

---

### E. JSON CONSISTENCY (5 min)

**E1. Check ID Types**
```bash
# Apri DevTools Console (F12) e esegui:

# Verifica clubs
fetch('/api/clubs').then(r => r.json()).then(d => {
  console.log('Club ID type:', typeof d[0].id);
  console.log('Club ID value:', d[0].id);
});

# Verifica announcements
fetch('/api/announcements').then(r => r.json()).then(d => {
  console.log('Announcement ID type:', typeof d[0].id);
  console.log('Announcement clubId type:', typeof d[0].clubId);
});

# Risultato atteso: tutti "number", NON "string"
```

**E2. Check Data Files Directly**
```bash
# Terminal
cd /Users/marcogregorio/workspace_sportlink_demo/sportlink-demo

# Verifica clubs.json
cat data/clubs.json | jq '.[] | {id, name, id_type: (.id | type)}'
# Atteso: id_type = "number"

# Verifica announcements.json
cat data/announcements.json | jq '.[] | {id, clubId, id_type: (.id | type), clubId_type: (.clubId | type)}'
# Atteso: id_type = "number", clubId_type = "number"

# Verifica club-memberships.json
cat data/club-memberships.json | jq '.[] | {id, userId, clubId, userId_type: (.userId | type), clubId_type: (.clubId | type)}'
# Atteso: tutti "number"

# Verifica applications.json
cat data/applications.json | jq '.[] | {id, announcementId, playerId, announcementId_type: (.announcementId | type), playerId_type: (.playerId | type)}'
# Atteso: tutti "number"
```

---

## 📊 RESULT SUMMARY

Compila dopo aver eseguito tutti i test:

```
A. CLUB MANAGEMENT
  A1. Club List              [ ] PASS [ ] FAIL [ ] SKIP
  A2. Club Detail - Info     [ ] PASS [ ] FAIL [ ] SKIP
  A3. Club Tab Opportunities [ ] PASS [ ] FAIL [ ] SKIP
  A4. Members Tab Hidden     [ ] PASS [ ] FAIL [ ] SKIP
  A5. Members Tab Visible    [ ] PASS [ ] FAIL [ ] SKIP
  A6. Create Club            [ ] PASS [ ] FAIL [ ] SKIP

B. MEMBERSHIP & PERMISSIONS
  B1. Join Request           [ ] PASS [ ] FAIL [ ] SKIP
  B2. Accept Request         [ ] PASS [ ] FAIL [ ] SKIP

C. ANNOUNCEMENTS / OPPORTUNITIES
  C1. Create Announcement    [ ] PASS [ ] FAIL [ ] SKIP
  C2. Date Validation        [ ] PASS [ ] FAIL [ ] SKIP
  C3. Opportunities List     [ ] PASS [ ] FAIL [ ] SKIP
  C4. Apply for Opportunity  [ ] PASS [ ] FAIL [ ] SKIP

D. PERMISSION CHECKS
  D1. Player no Create btn   [ ] PASS [ ] FAIL [ ] SKIP
  D2. Player no Members tab  [ ] PASS [ ] FAIL [ ] SKIP
  D3. Admin sees all         [ ] PASS [ ] FAIL [ ] SKIP

E. JSON CONSISTENCY
  E1. ID Types Check         [ ] PASS [ ] FAIL [ ] SKIP
  E2. Data Files Direct      [ ] PASS [ ] FAIL [ ] SKIP

OVERALL: [ ] ALL PASS [ ] SOME FAIL
```

---

## 🐛 Issue Tracker

Se qualcosa fallisce, documenta qui:

| Test | Error | Traceback | Fix Applied |
|------|-------|-----------|-------------|
|      |       |           |             |

---

**Start Time**: ___:___  
**End Time**: ___:___  
**Duration**: ___min  
**Tester**: ___________  
**Approved**: [ ]

