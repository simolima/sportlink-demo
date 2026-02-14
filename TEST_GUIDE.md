# 🧪 GUIDA DI TEST - Social Links e Autovalutazione

## 📋 Checklist di Test

### 1️⃣ Test Social Links

**Accedi al profilo di test:**
```
URL: http://localhost:3000/profile/example_player_001
```

**Cosa vedere:**
- ✅ Nel ProfileHeader, sotto la bio, dovrebbero apparire le icone social colorate
- ✅ Cliccando sulle icone, aprono i link ai social (Instagram, TikTok, YouTube, Facebook)

**Modifica Social Links:**
```
1. Vai su http://localhost:3000/profile/edit (se sei loggato come Marco Rossi)
2. Scorri fino alla sezione "Link Social Media"
3. Aggiungi/modifica i tuoi social links
4. Salva il profilo
5. Torna al profilo e verifica che i link siano salvati
```

---

### 2️⃣ Test Autovalutazione (Calcio)

**Visualizzazione:**
```
URL: http://localhost:3000/profile/example_player_001
```

**Cosa vedere:**
- ✅ Nel profilo, dovrebbe apparire una tab "Autovalutazione" (vicino a "Informazioni")
- ✅ Cliccando su "Autovalutazione", vedi le abilità con:
  - 🌟 Stelle (0-5)
  - 📊 Barre di progresso colorate
  - 📋 Abilità universali + specifiche per ruolo (Attaccante)

**Modifica Autovalutazione:**
```
1. Vai su http://localhost:3000/profile/edit (loggato come Marco Rossi/Giocatore)
2. Scorri fino alla sezione "Abilità Calcio"
3. Modifica gli slider:
   - Abilità Universali (Velocità, Resistenza, ecc.)
   - Abilità Comuni (Controllo palla, Passaggio, Tiro, Visione)
   - Seleziona il ruolo (Attaccante/Centrocampista/Difensore/Portiere)
   - Compila le abilità specifiche del ruolo
4. Salva il profilo
5. Torna al profilo e verifica nella tab "Autovalutazione"
```

---

### 3️⃣ Test Autovalutazione (Allenatore Pallavolo)

**Login come Allenatore:**
```
URL: http://localhost:3000/profile/example_coach_001
```

**Visualizzazione:**
- ✅ Tab "Autovalutazione" visibile
- ✅ Mostra abilità universali + specifiche Pallavolo

**Modifica:**
```
1. Vai su http://localhost:3000/profile/edit (loggato come Giovanni Bianchi/Allenatore)
2. Scorri fino alla sezione "Abilità Allenatore"
3. Modifica:
   - Abilità Universali (Comunicazione, Preparazione Tattica, ecc.)
   - Abilità Pallavolo (Organizzazione Difensiva, Rotazioni, Gestione Tempi)
4. Salva
5. Verifica nel profilo
```

---

## 🔍 Test Specifici

### Test dei Ruoli - Calcio
Modifica il ruolo durante l'autovalutazione e verifica che cambiano le abilità:
- ❌ Attaccante → cambia da "Efficacia Sottoporta" a altri campi
- ❌ Centrocampista → mostra "Distribuzione", "Copertura Difensiva", "Verticalizzazione"
- ❌ Difensore → mostra "Marcatura", "Posizionamento Difensivo", "Anticipo"
- ❌ Portiere → mostra campi specifici (Reattività, Uscite Aeree, ecc.)

### Test Salvataggio
1. Modifica social links + autovalutazione
2. Salva
3. Logout (localStorage.clear())
4. Accedi di nuovo
5. Verifica che i dati persistono

### Test Social Links - Visualizzazione
- ✅ Instagram con icona rosa/rosa scuro
- ✅ TikTok con icona nera
- ✅ YouTube con icona rossa
- ✅ Facebook con icona blu
- ✅ Twitter con icona grigia
- ✅ LinkedIn con icona blu scuro
- ✅ Twitch con icona viola

---

## 🐛 Se Trovi Problemi

### Errore: Tab "Autovalutazione" non appare
- Verifica che `playerSelfEvaluation` o `coachSelfEvaluation` è compilato nel JSON
- Controlla la console del browser (F12 → Console)

### Errore: Social links non vengono salvati
- Verifica che il fetch POST a `/api/users` funziona
- Controlla che il body contiene `socialLinks`

### Errore: Slider non funziona
- Verifica che il componente `SelfEvaluationForm` è importato correttamente
- Controlla che gli slider HTML5 funzionano (dovrebbe vedere range 0-5)

---

## ✅ Checklist di Completamento

- [ ] Social links visualizzati nel profilo
- [ ] Social links salvati e persistenti
- [ ] Tab "Autovalutazione" visibile per Players con autovalutazione
- [ ] Tab "Autovalutazione" visibile per Coaches con autovalutazione
- [ ] Form autovalutazione modificabile
- [ ] Ruoli dinamici per Calcio
- [ ] Abilità specifiche cambiano al cambio ruolo
- [ ] Autovalutazione salvata e persistente
- [ ] Visualizzazione con stelle e barre funziona
- [ ] Test su tutti e 3 gli sport (Calcio, Pallavolo, Basket)

---

## 📍 URL Utili

**Users di test:**
- Marco Rossi (Player/Calcio): `http://localhost:3000/profile/example_player_001`
- Giovanni Bianchi (Coach/Pallavolo): `http://localhost:3000/profile/example_coach_001`
- Modifica profilo: `http://localhost:3000/profile/edit`

**API:**
- Get users: `GET http://localhost:3000/api/users`
- Update user: `PATCH http://localhost:3000/api/users` (body: { id, socialLinks, playerSelfEvaluation, ... })

---

Generated: $(date)
Status: ✅ Ready for testing
