# 📊 ANALISI COERENZA DATABASE ↔ CODICE
**Data**: 1 gennaio 2026  
**Schema SQL**: `supabase/schema_definitivo.sql`  
**Codebase**: Frontend/Backend SportLink

---

## 🔴 PROBLEMI CRITICI (BREAKING CHANGES)

### 1. **NAMING MISMATCH: camelCase vs snake_case**
**Gravità**: 🔴 CRITICO - Richiede refactoring completo

#### Schema SQL (snake_case):
```sql
profiles:
  - first_name
  - last_name
  - avatar_url
  - cover_url
  - birth_date
  - phone_number
  - role_id
```

#### Codice TypeScript (camelCase):
```typescript
User {
  firstName: string
  lastName: string
  avatarUrl: string
  coverUrl: string
  birthDate: string
  professionalRole: ProfessionalRole
}
```

**Impatto**:
- ❌ Tutte le API routes leggono/scrivono in camelCase su JSON
- ❌ Il frontend si aspetta camelCase
- ❌ Supabase restituirà snake_case
- ❌ Serve layer di trasformazione o refactoring completo

**Soluzioni possibili**:
1. **Opzione A**: Aggiungere transformer per convertire snake_case ↔ camelCase in ogni API call
2. **Opzione B**: Refactorare tutto il codice per usare snake_case (sconsigliato in TypeScript)
3. **Opzione C** (CONSIGLIATA): Usare alias SQL nelle query:
```sql
SELECT 
  first_name as "firstName",
  last_name as "lastName",
  avatar_url as "avatarUrl"
FROM profiles
```

---

### 2. **CAMPO RUOLO: Discrepanza Strutturale**
**Gravità**: 🔴 CRITICO

#### Schema SQL:
```sql
profiles.role_id: text → FK a lookup_roles(id)
-- Valori: 'player', 'coach', 'agent', 'sporting_director', etc.
```

#### Codice attuale:
```typescript
User.professionalRole: ProfessionalRole
// Valori: 'Player', 'Coach', 'Agent', 'Sporting Director'
```

**Problemi**:
1. ❌ Nome campo diverso: `role_id` vs `professionalRole`
2. ❌ Formato diverso: `'player'` vs `'Player'`
3. ❌ Snake case vs PascalCase: `'sporting_director'` vs `'Sporting Director'`

**Fix necessario**:
```typescript
// Mappa per convertire
const ROLE_ID_TO_PROFESSIONAL_ROLE = {
  'player': 'Player',
  'coach': 'Coach',
  'agent': 'Agent',
  'sporting_director': 'Sporting Director',
  'athletic_trainer': 'Athletic Trainer',
  'nutritionist': 'Nutritionist',
  'physio': 'Physio/Masseur'
} as const;
```

---

### 3. **TABELLA `lookup_sports`: ID vs Name**
**Gravità**: 🟡 MEDIO

#### Schema SQL:
```sql
lookup_sports:
  id: bigint (1, 2, 3)
  name: text ('Calcio', 'Basket', 'Volley')
```

#### Codice attuale:
```typescript
User.sports: SupportedSport[]
// Valori diretti: ['Calcio', 'Basket', 'Pallavolo']
```

**Problema**:
- ❌ Il codice usa stringhe, il DB usa ID numerici
- ❌ 'Pallavolo' nel codice vs 'Volley' nel DB

**Fix necessario**:
- Join con lookup_sports per ottenere nomi
- Normalizzare 'Pallavolo' → 'Volley' ovunque

---

### 4. **MANCANZA CAMPO `password` in Schema SQL**
**Gravità**: 🔴 CRITICO - Schema incompleto

#### Schema SQL:
```sql
profiles: NO password field
-- Supabase gestisce auth separatamente in auth.users
```

#### Codice attuale:
```typescript
User.password: string  // Salvato in users.json
CreateUserPayload { password: string }
```

**Problema**:
- ✅ Approccio corretto: Supabase Auth gestisce password in `auth.users`
- ❌ Ma il codice attuale salva password in chiaro in JSON (INSICURO!)

**Fix necessario**:
- Rimuovere `password` da `User` type
- Usare Supabase Auth per login/signup
- ❌ MAI salvare password in `profiles` table

---

## 🟡 PROBLEMI MEDI (Richiedono modifiche)

### 5. **Campi Profile Mancanti nel DB**

#### Presenti nel codice ma assenti nel DB:
```typescript
User {
  availability?: AvailabilityStatus      // ❌ Non nel DB
  level?: Level                           // ⚠️ Esiste come lookup_levels ma non linkato
  dominantFoot?: string                   // ✅ Presente in physical_stats
  secondaryRole?: string                  // ❌ Non nel DB
  footballPrimaryPosition?: string        // ⚠️ Esiste come lookup_positions
  footballSecondaryPosition?: string      // ⚠️ Esiste in profile_secondary_positions
  specificRole?: string                   // ❌ Non nel DB
  dominantHand?: string                   // ✅ Presente in physical_stats
  experiences?: any[]                     // ❌ Non nel DB
}
```

**Fix**:
1. Decidere se aggiungere campi al DB o rimuovere dal codice
2. Mappare correttamente posizioni calcio con `lookup_positions`

---

### 6. **Tabella `physical_stats` vs Campi Embedded**

#### Schema SQL (separato):
```sql
physical_stats (1:1 con profiles):
  - height_cm
  - weight_kg
  - dominant_foot
  - dominant_hand
```

#### Codice attuale (embedded in User):
```typescript
User {
  dominantFoot?: string
  dominantHand?: string
  // height/weight non presenti
}
```

**Fix**:
- Decidere se fare JOIN automatico o creare type separato:
```typescript
type UserWithPhysicalStats = User & {
  physicalStats?: {
    heightCm?: number
    weightKg?: number
    dominantFoot?: string
    dominantHand?: string
  }
}
```

---

### 7. **Club Memberships: Ruoli Diversi**

#### Schema SQL:
```sql
club_memberships.club_role: 'Admin' | 'Staff' | 'Player'
```

#### Codice TypeScript:
```typescript
ClubRole = 'Admin' | 'Manager' | 'Player' | 'Coach' | 'Staff' | 'Scout'
```

**Problema**:
- ❌ 'Manager', 'Coach', 'Scout' non sono validi nel DB
- ✅ 'Staff' è generico e copre tutti

**Fix**: Decidere schema definitivo o mappare ruoli aggiuntivi

---

### 8. **Opportunities: Type vs RoleRequired**

#### Schema SQL:
```sql
opportunities:
  - role_id: FK a lookup_roles (player, coach, agent...)
  - position_id: FK a lookup_positions (opzionale)
```

#### Codice TypeScript:
```typescript
Opportunity {
  type: OpportunityType  // 'Player Search', 'Coach Search'...
  roleRequired: ProfessionalRole  // 'Player', 'Coach'...
  position?: string
}
```

**Problema**:
- ❌ Campo `type` non esiste nel DB
- ✅ `role_id` copre `roleRequired`
- ⚠️ `position` è stringa nel codice, FK nel DB

**Fix**: Rimuovere `type` e usare solo `role_id` + `position_id`

---

## 🟢 PUNTI POSITIVI (Schema Corretto)

### ✅ Tabelle Correttamente Mappate:
1. **follows** → Codice gestisce correttamente follower/following
2. **blocks** → Presente come `blocked_agents` nel codice
3. **affiliations** → Struttura identica
4. **messages** → Struttura identica
5. **notifications** → Struttura molto simile
6. **clubs** → Struttura compatibile
7. **club_join_requests** → Struttura identica
8. **applications** → Struttura identica

### ✅ Constraint SQL Corretti:
- `check_birth_date_valid` (13-120 anni) ✅ Validato anche nel frontend
- `check_names_valid` (lunghezza > 0) ✅ Validato nel frontend
- `check_expiry_date_future` ✅ Logico e necessario
- Unique constraints corretti su email, username, etc.

### ✅ Soft Delete Implementato Ovunque:
- `deleted_at` su tutte le tabelle ✅
- Indici filtrati con `WHERE deleted_at IS NULL` ✅

---

## 📋 TABELLE DATABASE vs FILE JSON

| Tabella SQL              | File JSON Attuale       | Status |
|--------------------------|-------------------------|--------|
| `profiles`               | `users.json`            | ⚠️ Mapping |
| `physical_stats`         | ❌ Non esiste           | 🟡 Nuovo |
| `profile_sports`         | ❌ Embedded in users    | ⚠️ Mapping |
| `profile_secondary_positions` | ❌ Non esiste    | 🟡 Nuovo |
| `clubs`                  | `clubs.json`            | ✅ OK |
| `club_memberships`       | `club-memberships.json` | ✅ OK |
| `club_join_requests`     | `club-join-requests.json` | ✅ OK |
| `opportunities`          | `opportunities.json`    | ⚠️ Mapping |
| `applications`           | `applications.json`     | ✅ OK |
| `follows`                | `follows.json`          | ✅ OK |
| `blocks`                 | `blocked-agents.json`   | ✅ OK |
| `affiliations`           | `affiliations.json`     | ✅ OK |
| `messages`               | `messages.json`         | ✅ OK |
| `notifications`          | `notifications.json`    | ✅ OK |
| `lookup_roles`           | ❌ Hardcoded in types   | 🟡 Nuovo |
| `lookup_sports`          | ❌ Hardcoded in types   | 🟡 Nuovo |
| `lookup_levels`          | ❌ Hardcoded in types   | 🟡 Nuovo |
| `lookup_positions`       | ❌ Non esiste           | 🟡 Nuovo |

---

## 🔧 AZIONI NECESSARIE (Priorità)

### 🔴 PRIORITÀ ALTA (Blocca deployment)

1. **Creare layer di trasformazione snake_case ↔ camelCase**
   ```typescript
   // lib/db-transform.ts
   export function toSnakeCase(obj: any): any { ... }
   export function toCamelCase(obj: any): any { ... }
   ```

2. **Mappare `professionalRole` ↔ `role_id`**
   ```typescript
   // lib/role-mapping.ts
   export const ROLE_MAP = {
     'Player': 'player',
     'Coach': 'coach',
     // ...
   }
   ```

3. **Gestire `sports` come array di ID invece di nomi**
   ```typescript
   // Cambiare da: sports: ['Calcio', 'Basket']
   // A: sport_ids: [1, 2]
   ```

4. **Rimuovere campo `password` da User type**
   - Usare solo Supabase Auth
   - Aggiornare signup/login flows

### 🟡 PRIORITÀ MEDIA (Post-deployment)

5. **Decidere gestione campi extra**
   - `availability`, `level`, `secondaryRole`, `experiences`
   - Aggiungere al DB o rimuovere dal codice?

6. **Normalizzare `ClubRole` enum**
   - Allineare codice con DB schema

7. **Aggiungere tabelle lookup al codice**
   - Query `lookup_roles`, `lookup_sports`, etc. all'avvio
   - Cache in frontend

### 🟢 PRIORITÀ BASSA (Refactoring futuro)

8. **Creare types separati per physical_stats**
9. **Implementare profile_secondary_positions**
10. **Aggiungere validazione frontend per constraint DB**

---

## 💡 RACCOMANDAZIONI ARCHITETTURALI

### 1. **API Layer Pattern**
Creare un layer intermedio tra Supabase e Frontend:

```typescript
// lib/api/profiles.ts
export async function getProfile(id: string): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      physical_stats (*),
      profile_sports (
        *,
        sport:lookup_sports (*)
      )
    `)
    .eq('id', id)
    .single()
  
  // Transform snake_case → camelCase
  return transformProfile(data)
}
```

### 2. **Type Generation da Schema SQL**
Usare tool come `supabase gen types typescript` per generare types:
```bash
npx supabase gen types typescript --project-id <id> > lib/database.types.ts
```

### 3. **Migration Graduale**
Non migrare tutto insieme:
1. ✅ Prima: Solo lettura da Supabase (read-only)
2. ✅ Poi: Scrittura nuovi record
3. ✅ Infine: Migrare dati esistenti

---

## 📊 COMPATIBILITÀ SCORE

| Componente               | Compatibilità | Note |
|-------------------------|---------------|------|
| User/Profile structure  | 🟡 60%        | Mapping necessario |
| Clubs                   | ✅ 95%        | Quasi perfetto |
| Opportunities           | 🟡 70%        | Rimuovere `type` |
| Applications            | ✅ 95%        | OK |
| Social (follows/blocks) | ✅ 100%       | Perfetto |
| Messages                | ✅ 100%       | Perfetto |
| Notifications           | ✅ 90%        | Metadata compatibile |
| Auth flow               | 🔴 30%        | Riscrivere con Supabase Auth |

**Score Totale**: 🟡 **75%** - Buona base ma richiede refactoring significativo

---

## 🎯 PROSSIMI PASSI SUGGERITI

1. ✅ **Oggi**: Validare questa analisi con team
2. ✅ **Domani**: Creare transformer layer (snake_case ↔ camelCase)
3. ✅ **Questa settimana**: Implementare profile API con Supabase
4. ✅ **Prossima settimana**: Migrare auth flow
5. ✅ **Entro 2 settimane**: Test completo con dati reali

---

## 📝 NOTE FINALI

**Schema SQL**: ✅ Ben progettato, sicuro, scalabile  
**Codice esistente**: ✅ Funzionale ma non compatibile 1:1  
**Rischio**: 🟡 Medio - Gestibile con refactoring pianificato  
**Tempo stimato**: 3-5 giorni di lavoro per allineamento completo

---

**Prossima azione**: Discussione con team per decidere strategia di migrazione (graduale vs big bang)
