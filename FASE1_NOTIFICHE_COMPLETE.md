================================================================================
SPORTLINK - SISTEMA NOTIFICHE COMPLETO (FASE 1 + FASE 2)
Data: 11 Dicembre 2025
================================================================================

## OBIETTIVO FASE 1
Consolidare e migliorare il sistema notifiche esistente con:
1. Supporto per notifiche messaggi ricevuti
2. Centralizzazione logica routing e colori
3. UX migliorata con filtri e indicatori di lettura

================================================================================
## MODIFICHE IMPLEMENTATE
================================================================================

### 1. NUOVO FILE: lib/notification-utils.ts
**Utility centralizzate per gestione notifiche**

Funzioni esportate:
- `getNotificationDestination(type, metadata)` → Determina URL di destinazione
- `getNotificationColor(type)` → Colore badge per tipo notifica
- `getNotificationDotColor(type)` → Colore pallino "unread"
- `formatNotificationType(type)` → Formattazione display tipo

**Vantaggi:**
- Logica DRY (Don't Repeat Yourself)
- Singolo punto di configurazione
- Facile manutenzione e aggiunta nuovi tipi


### 2. NUOVO TIPO NOTIFICA: message_received
**Aggiunto in lib/types.ts → NOTIFICATION_TYPES**

```typescript
'message_received' // Notifica quando ricevi un nuovo messaggio in chat
```

**Metadata richiesti:**
```typescript
{
  fromUserId: string,
  fromUserName: string,
  conversationId: string, // ID utente mittente per aprire chat
  messageId: number
}
```

**Routing:** `/messages/{conversationId}`
**Colore badge:** Azzurro (`bg-cyan-100 text-cyan-800`)
**Colore pallino:** Cyan (`bg-cyan-500`)


### 3. INTEGRAZIONE API MESSAGES
**File: app/api/messages/route.ts**

Modifiche al metodo `POST`:
- Dopo salvataggio messaggio, crea notifica automatica
- Carica dati utente mittente da `data/users.json`
- Invia notifica al destinatario con tipo `message_received`
- Gestisce errori notifica senza bloccare invio messaggio

**Flusso:**
```
Utente A invia messaggio a Utente B
  ↓
Messaggio salvato in data/messages.json
  ↓
Sistema recupera nome Utente A
  ↓
Notifica creata per Utente B
  ↓
Utente B vede campanella aggiornata
```


### 4. REFACTORING notification-bell.tsx
**Rimozione codice duplicato, utilizzo helper centralizzati**

**Prima:**
- Funzione locale `getNotificationDestination()` (50+ righe)
- Colore pallino hardcoded (`bg-blue-500`)

**Dopo:**
- Import da `lib/notification-utils`
- Colore pallino dinamico con `getNotificationDotColor()`
- Codice ridotto del 40%


### 5. REFACTORING notifications/page.tsx
**Miglioramento UX e centralizzazione logica**

**Cambiamenti:**
1. **Rimozione codice duplicato:**
   - Eliminata funzione locale `getNotificationDestination()`
   - Eliminata funzione locale `getTypeColor()`
   - Import da `lib/notification-utils`

2. **Nuova UX indicatori lettura:**
   - Badge "Non letta" con pallino blu per notifiche non lette
   - Sfondo blu chiaro (`bg-blue-50`) per notifiche non lette
   - Sfondo bianco per notifiche lette

3. **Miglioramento filtri:**
   - Tab "Tutte" mostra tutte, ma evidenzia non lette
   - Tab "Non lette" mostra solo `read: false`
   - Messaggio contestuale quando nessun risultato

4. **Click behavior migliorato:**
   - Click su notifica → segna come letta → naviga
   - Evita doppio click per navigare
   - Azioni (elimina/segna letta) bloccano propagazione click


### 6. GESTIONE STATO READ
**Già implementata nell'API esistente, ora utilizzata correttamente**

**Endpoints utilizzati:**
- `PUT /api/notifications` con `{ id, read: true }` → Segna singola come letta
- `PUT /api/notifications` con `{ markAllAsRead: true, userId }` → Segna tutte come lette

**Comportamento:**
- Campanella mostra solo notifiche con `read: false`
- Click notifica → `markAsRead()` → aggiorna stato locale → naviga
- Pulsante "Segna tutte come lette" → aggiorna tutte in una chiamata
- Polling ogni 30s per aggiornare conteggio

================================================================================
## MAPPATURA COMPLETA NOTIFICHE
================================================================================

| Tipo Notifica         | Destinazione                | Colore Badge        | Pallino    |
|-----------------------|-----------------------------|---------------------|------------|
| affiliation_request   | /player/affiliations        | Viola               | Viola      |
| affiliation_accepted  | /agent/affiliations         | Verde               | Viola      |
| affiliation_rejected  | /agent/affiliations         | Rosso               | Viola      |
| club_join_request     | /clubs                      | Arancione           | Arancione  |
| club_join_accepted    | /clubs                      | Arancione           | Arancione  |
| club_join_rejected    | /clubs                      | Arancione           | Arancione  |
| new_follower          | /profile/{fromUserId}       | Blu (#2341F0)       | Blu        |
| new_application       | /club-applications          | Giallo              | Giallo     |
| candidacy_accepted    | /my-applications            | Verde               | Verde      |
| candidacy_rejected    | /my-applications            | Rosso               | Rosso      |
| **message_received**  | **/messages/{conversationId}** | **Azzurro**     | **Cyan**   |
| new_opportunity       | /opportunities/{id}         | Indaco              | Blu        |
| permission_granted    | /clubs/{clubId}             | Verde smeraldo      | Blu        |
| permission_revoked    | /clubs/{clubId}             | Grigio              | Blu        |

================================================================================
## COME TESTARE
================================================================================

### Test 1: Notifica Message Received
1. Login come Utente A
2. Vai su `/messages`
3. Invia messaggio a Utente B
4. Logout e login come Utente B
5. ✅ Campanella mostra badge con "1"
6. ✅ Click campanella → notifica "Nuovo messaggio ricevuto"
7. ✅ Click notifica → redirect a `/messages/{userAId}`
8. ✅ Notifica segnata come letta automaticamente

### Test 2: Filtri Notifiche
1. Login come utente con notifiche miste (lette + non lette)
2. Vai su `/notifications`
3. ✅ Default: tab "Tutte" attivo
4. ✅ Notifiche non lette evidenziate con sfondo blu + badge "Non letta"
5. Click tab "Non lette"
6. ✅ Mostra solo notifiche con pallino blu
7. Click "Segna tutte come lette"
8. ✅ Tutti gli sfondi diventano bianchi
9. ✅ Badge "Non letta" sparisce
10. ✅ Campanella badge diventa "0"

### Test 3: Click Notifica
1. Login e vai su `/notifications`
2. Trova notifica NON letta con destinazione (es. new_follower)
3. Click notifica
4. ✅ Redirect immediato a destinazione
5. Torna su `/notifications`
6. ✅ Notifica ora ha sfondo bianco (letta)

### Test 4: Centralizzazione Logica
1. Verifica campanella e pagina `/notifications` usano stessi colori
2. ✅ `new_follower` → blu in entrambi
3. ✅ `message_received` → cyan in entrambi
4. ✅ Click porta stessa destinazione da campanella e pagina

================================================================================
## ARCHITETTURA FINALE
================================================================================

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
├─────────────────────────────────────────────────────────────┤
│  Navbar → NotificationBell (campanella + dropdown)          │
│  /notifications → NotificationsPage (lista completa)        │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
                    fetch/update
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  API LAYER                                  │
├─────────────────────────────────────────────────────────────┤
│  GET /api/notifications?userId=X&unreadOnly=true            │
│  POST /api/notifications (create)                           │
│  PUT /api/notifications (mark read/unread)                  │
│  DELETE /api/notifications (delete)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
                    read/write
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                 DATA STORAGE                                │
├─────────────────────────────────────────────────────────────┤
│  data/notifications.json                                    │
│  [ { id, userId, type, title, message, metadata, read,      │
│      createdAt } ]                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION TRIGGERS (esempi)                 │
├─────────────────────────────────────────────────────────────┤
│  POST /api/follows → crea new_follower                      │
│  POST /api/messages → crea message_received ⭐ NUOVO        │
│  POST /api/applications → crea new_application              │
│  PUT /api/applications (accept) → crea candidacy_accepted   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               SHARED UTILITIES                              │
├─────────────────────────────────────────────────────────────┤
│  lib/notification-utils.ts ⭐ NUOVO                         │
│    - getNotificationDestination()                           │
│    - getNotificationColor()                                 │
│    - getNotificationDotColor()                              │
│    - formatNotificationType()                               │
│                                                             │
│  lib/types.ts                                               │
│    - NOTIFICATION_TYPES (include message_received)          │
└─────────────────────────────────────────────────────────────┘
```

================================================================================
## FILE MODIFICATI
================================================================================

### Nuovi File
- ✅ `lib/notification-utils.ts` (194 righe)

### File Modificati
- ✅ `lib/types.ts` - Aggiunto tipo `message_received`
- ✅ `app/api/messages/route.ts` - Creazione notifica in POST
- ✅ `components/notification-bell.tsx` - Refactoring con helper
- ✅ `app/notifications/page.tsx` - Refactoring + UX migliorata

### File Non Modificati (già corretti)
- ✅ `app/api/notifications/route.ts` - Già gestisce read/unread
- ✅ `data/notifications.json` - Struttura già corretta

================================================================================
## PROSSIME FASI SUGGERITE
================================================================================

### Fase 2: Notifiche Real-Time
- [ ] WebSocket o Server-Sent Events per push notifications
- [ ] Aggiornamento campanella senza polling (performance)
- [ ] Suono/vibrazione per nuove notifiche (opzionale)

### Fase 3: Preferenze Notifiche
- [ ] Pagina `/settings/notifications` per preferenze utente
- [ ] Toggle on/off per tipo notifica
- [ ] Modalità "Non disturbare"
- [ ] Email digest (riepilogo giornaliero/settimanale)

### Fase 4: Notifiche Raggruppate
- [ ] "Mario e altre 4 persone ti seguono" invece di 5 notifiche separate
- [ ] Raggruppamento temporale (ultime 24h)
- [ ] Espansione on-click per vedere dettagli

### Fase 5: Mobile App Integration
- [ ] Push notifications native iOS/Android
- [ ] Badge app icon con conteggio
- [ ] Deep linking verso contenuti specifici

================================================================================
## NOTE TECNICHE
================================================================================

### Perché lib/notification-utils.ts e non un componente?
- Le funzioni sono pure (input → output, no side effects)
- Riutilizzabili in qualsiasi contesto (client/server)
- Testabili facilmente (unit tests)
- Evita duplicazione logica tra componenti

### Gestione Errori Notifica Messaggi
Il POST `/api/messages` avvolge la creazione notifica in try/catch:
- Se notifica fallisce, messaggio viene comunque salvato
- Console.error per debugging ma non blocca user flow
- Priorità: funzionalità core (messaggistica) > feature aggiuntiva (notifica)

### Performance Polling
Polling ogni 30s è accettabile per MVP ma non ottimale:
- 2 richieste/minuto = 120 richieste/ora per utente
- Con 100 utenti attivi = 12k richieste/ora
- Soluzione futura: WebSocket riduce a 1 connessione permanente

### Colori Coerenti con Brand
- Blu principale: `#2341F0` (già usato nel design)
- Cyan messaggi: distintivo ma complementare
- Verde/Rosso: universalmente riconosciuti (successo/errore)
- Viola/Arancione: categorie intermedie

================================================================================
## FASE 2 - RAGGRUPPAMENTO E PREFERENZE
================================================================================

### OBIETTIVO FASE 2
Migliorare l'esperienza utente con:
1. Raggruppamento notifiche simili (UI-only, senza modificare storage)
2. Pagina preferenze per disattivare categorie
3. Integrazione preferenze nella creazione notifiche

================================================================================
### NUOVE FUNZIONALITÀ FASE 2
================================================================================

### 1. RAGGRUPPAMENTO NOTIFICHE

**Implementato in:** `lib/notification-utils.ts`

**Nuove funzioni esportate:**
- `groupNotifications(notifications)` → Raggruppa notifiche simili
- `isGroupedNotification(item)` → Type guard per distinguere gruppi
- `getNotificationCategory(type)` → Ritorna la categoria di un tipo

**Tipi raggruppabili:**
- `new_follower` → "Hai 3 nuovi follower"
- `new_application` → "3 nuove candidature per l'opportunità X"
- `message_received` → "Hai 4 nuovi messaggi da Mario Rossi"

**Logica di raggruppamento:**
- Stessa tipologia
- Finestra temporale (24h per follower/candidature, 30min per messaggi)
- Stesso riferimento (es. stessa opportunità, stesso mittente)

**Struttura GroupedNotification:**
```typescript
{
  id: string,                  // ID univoco gruppo
  type: 'group',               // Marker per identificare i gruppi
  notificationType: string,    // Tipo originale (es. 'new_follower')
  notifications: Notification[], // Notifiche contenute
  title: string,               // Titolo generato (es. "3 nuovi follower")
  message: string,             // Messaggio riassuntivo
  count: number,               // Conteggio
  hasUnread: boolean,          // Almeno una non letta
  destination: string | null,  // URL se tutte hanno stessa destinazione
  hasSameDestination: boolean, // Se true, click naviga direttamente
  createdAt: string,           // Data più recente
  groupKey: string             // Chiave di raggruppamento
}
```

**UX del gruppo:**
- Gruppo mostra icona categoria, conteggio, badge "Non lette"
- Click su gruppo con stessa destinazione → naviga direttamente
- Click su gruppo con destinazioni diverse → espande/comprimi accordion
- Notifiche espanse cliccabili singolarmente

### 2. PREFERENZE NOTIFICHE

**Nuova pagina:** `/notifications/settings`

**Categorie gestibili:**
| Categoria    | Tipi inclusi                                      | Icona |
|--------------|---------------------------------------------------|-------|
| Follower     | new_follower                                      | 👥    |
| Messaggi     | message_received                                  | 💬    |
| Candidature  | new_application, candidacy_accepted/rejected      | 📋    |
| Affiliazioni | affiliation_request/accepted/rejected/removed     | 🤝    |
| Club         | club_join_request/accepted/rejected               | 🏟️    |
| Opportunità  | new_opportunity                                   | 💼    |
| Permessi     | permission_granted/revoked                        | 🔐    |

**Funzionalità pagina impostazioni:**
- Toggle on/off per ogni categoria
- Pulsanti "Abilita tutte" / "Disabilita tutte"
- Salvataggio con feedback visivo
- Info box esplicativo

### 3. API PREFERENZE

**Nuovo endpoint:** `GET/POST /api/notification-preferences`

**GET ?userId=X:**
```json
{
  "userId": "123",
  "preferences": {
    "follower": true,
    "messages": true,
    "applications": true,
    "affiliations": true,
    "club": true,
    "opportunities": true,
    "permissions": true
  }
}
```

**POST body:**
```json
{
  "userId": "123",
  "preferences": { "messages": false }
}
```

**Storage:** `data/notification-preferences.json`

### 4. INTEGRAZIONE PREFERENZE NELLA CREAZIONE

**Modificato:** `app/api/notifications/route.ts`

Quando viene creata una notifica (POST):
1. Determina la categoria dal tipo
2. Legge preferenze utente destinatario
3. Se categoria disabilitata → ritorna `{ skipped: true }` senza creare

**Esempio risposta skip:**
```json
{
  "skipped": true,
  "reason": "notification_disabled_by_user",
  "message": "User has disabled notifications for this category"
}
```

================================================================================
### FILE CREATI/MODIFICATI FASE 2
================================================================================

**Nuovi file:**
- `app/notifications/settings/page.tsx` - Pagina impostazioni
- `app/api/notification-preferences/route.ts` - API preferenze
- `data/notification-preferences.json` - Storage preferenze

**File modificati:**
- `lib/notification-utils.ts` - Aggiunto grouping, categorie, preferenze
- `app/notifications/page.tsx` - Integrato raggruppamento e link settings
- `app/api/notifications/route.ts` - Verifica preferenze prima di creare

================================================================================
### COME TESTARE FASE 2
================================================================================

**Test 1: Raggruppamento Follower**
1. Crea 3+ notifiche `new_follower` per lo stesso utente
2. Vai su `/notifications`
3. ✅ Dovrebbe apparire "3 nuovi follower" in un unico box
4. ✅ Click espande per vedere i singoli follower
5. ✅ Click su singolo follower → vai al suo profilo

**Test 2: Raggruppamento Messaggi**
1. Invia 3+ messaggi dallo stesso utente (entro 30min)
2. Vai su `/notifications` del destinatario
3. ✅ Dovrebbe apparire "Hai 3 nuovi messaggi da X"
4. ✅ Click naviga direttamente alla conversazione

**Test 3: Preferenze**
1. Vai su `/notifications/settings`
2. Disabilita categoria "Follower"
3. ✅ Toggle diventa grigio
4. Click "Salva preferenze"
5. ✅ Messaggio "Preferenze salvate"
6. Fai seguire un utente test → non dovrebbe creare notifica

**Test 4: Verifica Skip**
1. Disabilita categoria "Messaggi"
2. Invia messaggio al tuo utente
3. Controlla API response → dovrebbe avere `skipped: true`
4. `/notifications` non mostra il messaggio

================================================================================
## CONCLUSIONE
================================================================================

✅ **FASE 1 + FASE 2 COMPLETATE CON SUCCESSO**

Il sistema notifiche è ora:
- ✅ **Completo** - Supporta tutti i tipi principali (inclusi messaggi)
- ✅ **Centralizzato** - Logica condivisa in lib/notification-utils.ts
- ✅ **User-friendly** - Filtri, indicatori lettura, navigazione intuitiva
- ✅ **Manutenibile** - Facile aggiungere nuovi tipi o modificare routing
- ✅ **Coerente** - Colori e comportamenti uniformi ovunque
- ✅ **Raggruppato** - Notifiche simili aggregate per migliore UX
- ✅ **Personalizzabile** - Utente può disabilitare categorie

**Pronto per deploy in ambiente MVP!**

Per aggiungere un nuovo tipo di notifica in futuro:
1. Aggiungi in `NOTIFICATION_TYPES` (lib/types.ts)
2. Aggiungi case in `getNotificationDestination()` (lib/notification-utils.ts)
3. Aggiungi case in `getNotificationColor()` (lib/notification-utils.ts)
4. Aggiungi mappatura in `NOTIFICATION_CATEGORIES` (lib/notification-utils.ts)
5. Aggiungi mappatura in `TYPE_TO_CATEGORY` (app/api/notifications/route.ts)
6. Crea notifica nel punto appropriato (API route)

**Fine Fase 1 + Fase 2** 🎉

