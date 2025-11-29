# SportLink Mobile App

App mobile React Native/Expo che condivide le API con il web app.

## Setup

```bash
cd mobile
pnpm install
```

## Sviluppo

### 1. Avvia il Web Server (IMPORTANTE!)

Prima di testare il mobile, avvia il web server dalla root:

```bash
# Terminal 1 - dalla root del progetto
pnpm dev
```

Il web server DEVE essere attivo su `http://localhost:3000` perché il mobile chiama le sue API.

### 2. Avvia l'app mobile

```bash
# Terminal 2 - dalla root del progetto
pnpm dev:mobile
```

Poi scansiona il QR code con Expo Go.

## Come Funziona

### API Condivise

Il mobile chiama le stesse API del web:

- `GET /api/users` - Lista utenti
- `POST /api/users` - Crea utente
- `GET /api/posts` - Lista post
- `POST /api/posts` - Crea post
- etc.

### File Importanti

- `lib/api.ts` - Configurazione API e helper fetch
- `lib/services.ts` - Servizi per login, posts, profili
- `App.tsx` - Schermata principale con login demo

### Storage Condiviso

**Stesso database!** Il mobile usa i file JSON del web:
- `data/users.json`
- `data/posts.json`
- `data/messages.json`

Se crei un utente nel web, puoi fare login nel mobile (e viceversa).

## Test

1. Apri il web su `http://localhost:3000`
2. Crea un account (o usa uno esistente)
3. Apri l'app mobile
4. Fai login con la stessa email
5. ✅ Dovresti vedere i tuoi dati!

## Configurazione API

Modifica `lib/api.ts` per cambiare l'URL:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000'  // Sviluppo
    : 'https://tuo-dominio.vercel.app', // Production
};
```

## Deploy

Dopo il deploy del web su Vercel:

1. Copia l'URL di produzione (es: `https://sportlink-demo.vercel.app`)
2. Aggiornalo in `lib/api.ts`
3. Build mobile con EAS:

```bash
cd mobile
npx eas-cli build --platform all
```

## Note

- **CORS**: Le API hanno headers CORS per accettare richieste dal mobile
- **Auth**: Usa lo stesso sistema del web (localStorage → AsyncStorage)
- **Dati**: Condivisi tramite le stesse API routes di Next.js
