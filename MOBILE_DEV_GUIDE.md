# 📱 Guida Sviluppo Mobile - SportLink

## Panoramica Architettura

Questo repository contiene **DUE applicazioni separate**:

```
sportlink-demo-template/
├── app/                    → Next.js Web App (porta 3000)
├── components/             → Componenti Web
├── lib/                    → Utilities Web
├── data/                   → Database JSON (condiviso)
├── mobile/                 → Expo Mobile App (porta 8081)
│   ├── screens/           → Schermate Mobile
│   ├── lib/               → Utilities Mobile
│   └── package.json       → Dipendenze Mobile (ISOLATE)
└── package.json           → Dipendenze Web
```

**⚠️ IMPORTANTE**: Le dipendenze sono **completamente isolate** - non c'è workspace condiviso.

---

## 🚀 Setup Iniziale

### 1. Installare Node.js e pnpm

```bash
# Verifica Node.js (versione >= 18)
node --version

# Installa pnpm globalmente
npm install -g pnpm
```

### 2. Installare Expo CLI Globalmente

```bash
npm install -g expo-cli
```

### 3. Installare Expo Go sul telefono

- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

---

## 💻 Workflow di Sviluppo

### Regola d'Oro: **Mai mescolare web e mobile**

| Cosa vuoi fare | Dove lavori | Comando |
|----------------|-------------|---------|
| Sviluppo Web | Root folder | `pnpm dev` |
| Sviluppo Mobile | Root folder | `pnpm dev:mobile` |
| Installare pacchetto Web | Root folder | `pnpm add <package>` |
| Installare pacchetto Mobile | `cd mobile/` | `pnpm add <package>` |

---

## 🔧 Avviare l'App Mobile

### Passo 1: Assicurati che il Web Server sia attivo

L'app mobile chiama le API del web server, quindi **deve essere sempre attivo**:

```powershell
# Terminale 1 - Avvia Web Server
pnpm dev
```

Aspetta finché vedi:
```
✓ Ready on http://localhost:3000
```

### Passo 2: Avvia Expo Metro Bundler

```powershell
# Terminale 2 - Avvia Expo
pnpm dev:mobile
```

Vedrai un **QR Code** nel terminale.

### Passo 3: Scansiona il QR Code

1. Apri **Expo Go** sul telefono
2. Scansiona il QR Code:
   - **Android**: Usa l'app Expo Go direttamente
   - **iOS**: Usa la fotocamera di sistema, poi apri in Expo Go

### Passo 4: Aspetta il bundle JavaScript

La prima volta impiega ~30 secondi. Vedrai:
```
Building JavaScript bundle: 100%
```

---

## 📝 Comandi Utili

### Web Development

```powershell
# Installare dipendenze web
pnpm install

# Avviare web dev server
pnpm dev

# Build per produzione web
pnpm build

# Aggiungere pacchetto web
pnpm add <nome-pacchetto>
```

### Mobile Development

```powershell
# Installare dipendenze mobile (dalla root)
cd mobile
pnpm install
cd ..

# Avviare Expo (dalla root)
pnpm dev:mobile

# Aggiungere pacchetto mobile
cd mobile
pnpm add <nome-pacchetto>
cd ..

# Pulire cache Expo (se problemi)
cd mobile
npx expo start -c
cd ..
```

---

## 🌐 Configurazione Rete

### Problema: App mobile non si connette alle API

L'app mobile usa l'indirizzo IP del tuo PC per connettersi al web server.

**File da controllare**: `mobile/lib/api.ts`

```typescript
// Sviluppo - Usa l'IP del tuo PC
const BASE_URL = 'http://192.168.1.37:3000'

// Produzione - Usa il dominio reale
// const BASE_URL = 'https://sportlink.com'
```

**Come trovare il tuo IP**:

```powershell
# Windows
ipconfig

# Cerca "IPv4 Address" della tua rete WiFi/Ethernet
# Esempio: 192.168.1.37
```

**Assicurati**:
- PC e telefono siano sulla **stessa rete WiFi**
- Firewall non blocchi la porta 3000

---

## 🔄 Workflow Completo Giornaliero

### Scenario: Vuoi lavorare su mobile

```powershell
# 1. Vai alla root del progetto
cd C:\Users\simon\Desktop\sportlink-demo-template

# 2. Avvia il web server (Terminale 1)
pnpm dev

# 3. Avvia Expo (Terminale 2)
pnpm dev:mobile

# 4. Scansiona QR code con Expo Go

# 5. Inizia a sviluppare!
# Modifica file in mobile/screens/ o mobile/lib/
# L'app si ricarica automaticamente
```

### Scenario: Vuoi lavorare sul web

```powershell
# 1. Vai alla root del progetto
cd C:\Users\simon\Desktop\sportlink-demo-template

# 2. Avvia il web server
pnpm dev

# 3. Apri browser su http://localhost:3000

# 4. Inizia a sviluppare!
# Modifica file in app/ o components/
```

---

## 🐛 Risoluzione Problemi

### Problema: "Port 3000 already in use"

```powershell
# Trova e chiudi il processo sulla porta 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Poi riavvia
pnpm dev
```

### Problema: "Expo package not found"

```powershell
# Reinstalla dipendenze mobile
cd mobile
Remove-Item -Recurse -Force node_modules
pnpm install
cd ..
```

### Problema: "Network timeout" sull'app mobile

1. Verifica che web server sia attivo (`pnpm dev`)
2. Controlla IP in `mobile/lib/api.ts`
3. Verifica che PC e telefono siano sulla stessa WiFi
4. Prova a disabilitare temporaneamente il firewall

### Problema: App mobile mostra schermata bianca

```powershell
# Pulisci cache Expo e riavvia
cd mobile
npx expo start -c
```

---

## 📦 Struttura Pacchetti

### Web (package.json nella root)

```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### Mobile (mobile/package.json)

```json
{
  "dependencies": {
    "expo": "~54.0.25",
    "react": "19.1.0",
    "react-native": "0.78.6"
  }
}
```

**Nota**: Versioni React diverse = OK perché isolate!

---

## ✅ Checklist Pre-Commit

Prima di fare commit, verifica:

- [ ] Web app funziona: `pnpm dev` → apri localhost:3000
- [ ] Mobile app funziona: `pnpm dev:mobile` → scansiona QR
- [ ] Nessun errore TypeScript: controlla editor
- [ ] Non hai modificato accidentalmente file dell'altra app
- [ ] Se hai aggiunto pacchetto mobile, è in `mobile/package.json`
- [ ] Se hai aggiunto pacchetto web, è in `package.json` root

---

## 🚢 Deploy

### Web App

```bash
# Vercel, Netlify, o qualsiasi hosting Next.js
pnpm build
```

### Mobile App

```bash
# Build Android APK
cd mobile
eas build --platform android

# Build iOS (richiede account Apple Developer)
eas build --platform ios
```

**Nota**: Per EAS Build serve configurare `eas.json` (guida separata).

---

## 👥 Team Workflow

### Se sei nuovo nel progetto:

```powershell
# 1. Clona repository
git clone https://github.com/simolima/sportlink-demo.git
cd sportlink-demo-template

# 2. Installa dipendenze WEB
pnpm install

# 3. Installa dipendenze MOBILE
cd mobile
pnpm install
cd ..

# 4. Configura IP per mobile (vedi sezione Configurazione Rete)
# Modifica mobile/lib/api.ts con il TUO IP

# 5. Avvia tutto
pnpm dev          # Terminale 1
pnpm dev:mobile   # Terminale 2
```

### Sincronizzazione con il team:

```bash
# Quando qualcuno aggiunge pacchetti
git pull
pnpm install              # Installa dipendenze web
cd mobile && pnpm install # Installa dipendenze mobile
```

---

## 🔐 Best Practices

### ✅ DO (Fai così)

- Lavora su un'app alla volta
- Installa pacchetti mobile da dentro `mobile/`
- Testa su dispositivo reale via Expo Go
- Usa TypeScript per type safety
- Committa spesso con messaggi chiari

### ❌ DON'T (Non fare)

- ~~Non creare `pnpm-workspace.yaml`~~ (causava conflitti)
- ~~Non installare pacchetti mobile dalla root~~
- ~~Non usare `localhost` in mobile/lib/api.ts~~
- ~~Non mixare dipendenze web/mobile~~
- ~~Non committare `node_modules/` o `.expo/`~~

---

## 📞 Supporto

**Problemi?** Controlla:

1. [Expo Documentation](https://docs.expo.dev/)
2. [Next.js Documentation](https://nextjs.org/docs)
3. Issues GitHub del progetto
4. Chiedi al team su Slack/Discord

---

## 📄 File Importanti

| File | Scopo |
|------|-------|
| `package.json` | Dipendenze web |
| `mobile/package.json` | Dipendenze mobile |
| `mobile/lib/api.ts` | Configurazione API (IP/URL) |
| `data/*.json` | Database condiviso |
| `.gitignore` | Esclude node_modules e cache |

---

**Ultima modifica**: 29 Novembre 2025  
**Autori**: Team SportLink
