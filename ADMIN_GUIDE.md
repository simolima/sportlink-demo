# 🔧 Guida Amministrazione SportLink

## 📋 Gestione Organizzazioni Sportive

### Filosofia del Sistema

Le organizzazioni sportive (`sports_organizations`) sono **gestite solo da amministratori**:
- ✅ Gli utenti possono **solo leggere** (autocomplete)
- ❌ Gli utenti **NON possono creare** nuove organizzazioni
- 🔒 Le creazioni avvengono **solo via database** (SQL Editor)

### Perché questo approccio?

1. **Qualità dei dati**: Evita duplicati e nomi non standardizzati
2. **Controllo**: Solo dati verificati entrano nel sistema
3. **Performance**: Database ottimizzato per ricerche autocomplete
4. **Integrità**: Coerenza nei nomi delle società (es: "AC Milan" non "Milan", "A.C. Milan", "Milano")

---

## 🚀 Popolamento Iniziale

### 1. Accedi a Supabase SQL Editor

1. Vai su [app.supabase.com](https://app.supabase.com)
2. Seleziona il progetto **SportLink**
3. Apri **SQL Editor** dalla sidebar

### 2. Esegui lo Script di Popolamento

```bash
# Copia il contenuto di questo file:
supabase/migrations/populate_sports_organizations.sql
```

Lo script contiene:
- ✅ Serie A calcio (20 squadre)
- ✅ Serie B calcio (10 esempi)
- ✅ Serie A basket (10 squadre)
- ✅ Serie A1 volley maschile (9 squadre)
- ✅ Serie A1 volley femminile (7 squadre)
- ✅ Top club internazionali (Premier, Liga, Bundesliga, Ligue 1)

**Totale: ~100 organizzazioni iniziali**

### 3. Verifica Inserimenti

Alla fine dello script troverai queste query di verifica:

```sql
-- Conta organizzazioni per sport e paese
SELECT sport, country, COUNT(*) as total
FROM public.sports_organizations
WHERE deleted_at IS NULL
GROUP BY sport, country;

-- Totale generale
SELECT COUNT(*) FROM public.sports_organizations WHERE deleted_at IS NULL;
```

---

## ➕ Aggiungere Nuove Organizzazioni

### Query Template

```sql
INSERT INTO public.sports_organizations (name, country, city, sport) 
VALUES ('Nome Club', 'Paese', 'Città', 'Sport')
ON CONFLICT (name, country, city, sport) DO NOTHING;
```

### Esempi

```sql
-- Aggiungere un club di calcio
INSERT INTO public.sports_organizations (name, country, city, sport) 
VALUES ('Spezia', 'Italia', 'La Spezia', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- Aggiungere più club insieme
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('Cittadella', 'Italia', 'Cittadella', 'Calcio'),
('Pisa', 'Italia', 'Pisa', 'Calcio'),
('Cosenza', 'Italia', 'Cosenza', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;
```

### Regole di Naming

1. **Nome ufficiale**: Usa il nome ufficiale del club
   - ✅ "AC Milan"
   - ❌ "Milan", "A.C. Milan"

2. **Consistenza**: Mantieni lo stesso formato per club simili
   - ✅ "Inter", "Juventus", "AC Milan"
   - ❌ "F.C. Internazionale Milano"

3. **Paese**: Nome completo in italiano
   - ✅ "Italia", "Inghilterra", "Spagna", "Germania", "Francia"
   - ❌ "IT", "UK", "ES"

4. **Sport**: Usa valori standard
   - ✅ "Calcio", "Basket", "Volley"
   - ❌ "Football", "Basketball", "Pallavolo"

---

## 🔍 Query Utili per Amministratori

### Cercare Organizzazioni

```sql
-- Cerca per nome (case-insensitive)
SELECT * FROM public.sports_organizations 
WHERE name ILIKE '%milan%' AND deleted_at IS NULL;

-- Cerca per sport
SELECT * FROM public.sports_organizations 
WHERE sport = 'Calcio' AND country = 'Italia' 
ORDER BY name;

-- Statistiche per sport
SELECT sport, COUNT(*) as total 
FROM public.sports_organizations 
WHERE deleted_at IS NULL 
GROUP BY sport;
```

### Modificare Organizzazioni

```sql
-- Correggere un nome
UPDATE public.sports_organizations 
SET name = 'AC Milan' 
WHERE name = 'Milan' AND country = 'Italia';

-- Correggere città
UPDATE public.sports_organizations 
SET city = 'Milano' 
WHERE name = 'Inter' AND country = 'Italia';
```

### Eliminare Organizzazioni (Soft Delete)

```sql
-- Soft delete (consigliato)
UPDATE public.sports_organizations 
SET deleted_at = NOW() 
WHERE name = 'Nome Club' AND country = 'Italia';

-- Ripristinare
UPDATE public.sports_organizations 
SET deleted_at = NULL 
WHERE name = 'Nome Club' AND country = 'Italia';

-- Hard delete (⚠️ usa solo se necessario)
DELETE FROM public.sports_organizations 
WHERE name = 'Nome Club' AND country = 'Italia';
```

---

## 📊 Monitoraggio

### Dashboard Query

```sql
-- Totale organizzazioni per sport
SELECT 
    sport,
    COUNT(*) as total,
    COUNT(DISTINCT country) as countries,
    COUNT(DISTINCT city) as cities
FROM public.sports_organizations
WHERE deleted_at IS NULL
GROUP BY sport;

-- Ultimi 20 inserimenti
SELECT name, country, city, sport, created_at 
FROM public.sports_organizations 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 20;

-- Organizzazioni senza città
SELECT name, country, sport 
FROM public.sports_organizations 
WHERE city IS NULL AND deleted_at IS NULL;
```

---

## 🔗 Integrazione con Career Experiences

### Come Funziona

Quando un utente aggiunge un'esperienza:

1. **Frontend**: L'utente seleziona il club da autocomplete
2. **API**: Verifica che `organization_id` esista in `sports_organizations`
3. **Salvataggio**: Crea record in `career_experiences` con riferimento all'org

### Gestione Errori

Se un utente prova a salvare un'esperienza con un club non presente:

```json
{
  "success": true,
  "count": 2,
  "experiences": [...],
  "errors": [
    {
      "experience": { "team": "Club Sconosciuto", ... },
      "error": "Organization not found: Club Sconosciuto (Italia, Calcio)"
    }
  ]
}
```

**Soluzione**: Aggiungere il club mancante via SQL.

---

## 🎯 Future: Pannello Admin

Quando il sistema crescerà, creare un pannello admin per:

1. **CRUD Organizzazioni**: UI friendly per aggiungere/modificare club
2. **Bulk Import**: Caricamento CSV/Excel
3. **Merge Duplicati**: Tool per unire club duplicati
4. **Statistiche**: Dashboard con metriche di utilizzo
5. **Approvazione Richieste**: Gli utenti possono richiedere nuovi club

### Esempio Endpoint Admin (futuro)

```typescript
// app/api/admin/sports-organizations/route.ts
export async function POST(req: NextRequest) {
    // 1. Verifica autenticazione admin
    const session = await getServerSession()
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. Crea organizzazione
    // ... logica esistente ...
}
```

---

## 📝 Checklist Popolamento

- [ ] Eseguito script `populate_sports_organizations.sql`
- [ ] Verificato totale organizzazioni (query di controllo)
- [ ] Testato autocomplete nel form esperienze
- [ ] Aggiunti club mancanti richiesti da utenti
- [ ] Documentato nuovi inserimenti

---

## 🆘 Supporto

Se hai dubbi o problemi:
1. Controlla i log API in Supabase Dashboard
2. Esegui query di verifica sopra
3. Contatta il team di sviluppo

**Note**: Questo approccio garantisce qualità e controllo sui dati, fondamentale per un social network professionale.
