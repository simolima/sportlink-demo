# 🚀 Quick Start Guide - SportLink

## Setup Ambiente (Una sola volta)

```powershell
cd C:\Users\simon\Desktop\sportlink-demo-template

# Se non hai già installato le dipendenze
npm install

# Configura il database (se necessario)
npm run db:migrate
npm run db:seed
```

---

## 🏃 Start Development Server

```powershell
cd C:\Users\simon\Desktop\sportlink-demo-template
npm run dev
```

**Output atteso:**
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  ✓ Ready in 2.2s
```

Apri http://localhost:3000 nel browser.

---

## 📝 Test del Flow Completo

### 1. Crea Account
1. Vai a http://localhost:3000
2. Clicca "Crea Account"
3. Compila form:
   - Nome: Marco
   - Cognome: Rossi
   - Email: marco@example.com
   - Data: 1990-01-15
   - Ruolo: Atleta
4. Clicca "Crea Profilo"
5. Verifica localStorage: apri DevTools (F12) → Application → Cookies → http://localhost:3000

### 2. Login
1. Clicca "Accedi" (navbar o landing)
2. Inserisci: marco@example.com
3. Clicca "Login"
4. Reindirizzato a / (landing page)
5. Navbar mostra: Feed, Profilo, Logout

### 3. Visualizza Feed
1. Clicca "Feed" (navbar)
2. Vai a http://localhost:3000/home
3. Verifica che carica i post da /api/posts

### 4. Profilo
1. Clicca "Profilo" (navbar)
2. Vai a http://localhost:3000/profile
3. Visualizza info profilo da localStorage

### 5. Logout
1. Clicca "Logout" (navbar)
2. localStorage clearato
3. Reindirizzato a /
4. Navbar torna a mostrare: Login, Crea Account

---

## 🛠️ Development Tasks

### Build produzione
```powershell
npm run build
# Output: `.next` folder creato
npm start
# Apri http://localhost:3000
```

### Linting
```powershell
npm run lint
```

### Prisma
```powershell
# Visualizza schema
npx prisma studio

# Nuova migrazione dopo schema change
npm run db:migrate

# Seed dati di test
npm run db:seed
```

---

## 📂 Modifica i File

### Aggiungi nuova pagina
```
1. Crea cartella: app/[nome-rotta]/
2. Crea file: page.tsx
3. Aggiungi "use client" in cima se serve interazione
4. Importa nel navbar se necessario
```

### Aggiungi nuovo componente
```
1. Crea file: components/[nome].tsx
2. Esporta di default
3. Importa dove serve: import [Nome] from '@/components/[nome]'
```

### Aggiungi API route
```
1. Crea cartella: app/api/[resource]/
2. Crea file: route.ts
3. Esporta: export async function GET(req) { ... }
4. Chiama da client: await fetch('/api/[resource]')
```

---

## 🔐 Dati Sensibili

**⚠️ Attenzione:** Il progetto usa localStorage per semplicità. 

Per produzione:
- Usa cookie HTTP-only con token JWT
- Implementa refresh token logic
- Valida sempre sul backend

**Credenziali di test:**
Nessuna hardcoded - usa la form di creazione profilo.

---

## 📊 Struttura Dati

### User (localStorage)
```javascript
{
  currentUserId: "1",
  currentUserName: "Marco Rossi",
  currentUserEmail: "marco@example.com"
}
```

### Post (from /api/posts)
```javascript
{
  id: 1,
  authorId: 1,
  authorName: "Marco Rossi",
  content: "Testo del post",
  createdAt: "2025-11-15T10:00:00Z",
  imageUrl: null,
  likes: 5,
  comments: 2
}
```

### User (from /api/users)
```javascript
{
  id: 1,
  email: "marco@example.com",
  firstName: "Marco",
  lastName: "Rossi",
  dateOfBirth: "1990-01-15",
  currentRole: "Atleta",
  bio: "Bio breve",
  experiences: [
    {
      title: "Calciatore",
      company: "AC Milan",
      from: "2020",
      to: "2023"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### "PowerShell execution policy" error
```powershell
Remove-Item -Path "$env:USERPROFILE\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1" -ErrorAction SilentlyContinue
npm run dev
```

### Port 3000 già in uso
```powershell
# Trova processo
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Termina processo (id esempio 1234)
Stop-Process -Id 1234 -Force

# O cambia porta
npm run dev -- -p 3001
```

### Build fallisce
```powershell
# Pulisci cache
Remove-Item -Recurse .next
Remove-Item node_modules -Recurse
npm install
npm run build
```

### Prisma errori
```powershell
npm run generate
npm run db:migrate
```

---

## 📚 File Importanti

| File | Scopo |
|------|-------|
| `app/layout.tsx` | Root layout con Navbar |
| `components/navbar.tsx` | Navigation condizionale |
| `components/login-card.tsx` | Email login form |
| `app/login/page.tsx` | Login landing |
| `app/home/page.tsx` | Feed autenticato |
| `app/profile/page.tsx` | Profilo utente |
| `prisma/schema.prisma` | DB schema |
| `package.json` | Dependencies |
| `tailwind.config.ts` | Tailwind settings |

---

## 🎯 Next Steps (Opzionali)

- [ ] Aggiungere validazione form (react-hook-form + zod)
- [ ] Migrare fetch a React Query
- [ ] Aggiungere autenticazione vera (JWT)
- [ ] Upload foto profilo
- [ ] Dark mode
- [ ] Notifiche real-time
- [ ] Unit tests

---

**Last Updated:** 15 Nov 2025
**Status:** ✅ Ready to code!
