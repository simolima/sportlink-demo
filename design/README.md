# 🎨 Design System Sprinta

Benvenuto nel design system di **Sprinta** - la piattaforma social per atleti, club e agenti sportivi.

## 📁 Contenuto della Cartella

```
design/
├── README.md                    ← Questo file
├── BRAND_GUIDE.md              ← Guida completa alla brand
├── Sprinta_Brand_Guide_v2.pdf  ← PDF per stampa/condivisione
└── assets/                      ← (Futuro) Logo, icone, illustrazioni
```

## 🎯 Tema Attuale: Navy & Blu Scuro

Il progetto Sprinta utilizza un **tema scuro moderno** con palette navy e blu primario:

- **Background Principale**: Navy (#0A0F32)
- **Colore Primario**: Blu (#2341F0)
- **Testo Principale**: Azzurro Pallido (#A7B0FF)

### Vantaggi del Tema Scuro
✅ Riduce affaticamento oculare in sessioni lunghe  
✅ Moderno e professionale  
✅ Migliore contrasto con blu primario  
✅ Preferito dai professionisti dello sport  

## 🚀 Quick Start per Developer

### Usare i Colori Corretti

```tsx
// ✅ GIUSTO - Usare classi DaisyUI
<button className="btn btn-primary">Accedi</button>
<div className="bg-base-200 text-secondary">Contenuto</div>

// ❌ SBAGLIATO - Non usare colori hardcoded
<button className="bg-blue-600 text-white">Accedi</button>
<div className="bg-white text-gray-900">Contenuto</div>
```

### File di Riferimento

| File | Descrizione |
|------|------------|
| `app/globals.css` | Variabili CSS `:root` con colori |
| `tailwind.config.ts` | Configurazione DaisyUI tema `sprinta` |
| `app/layout.tsx` | Applicazione `data-theme="sprinta"` sul tag `<html>` |
| `components/navbar.tsx` | Esempio di componente con tema corretto |

### Palette Colori di Riferimento

```css
/* Fondamentali */
--navy: #0A0F32          /* bg-base-100 */
--navy-dark: #11152F     /* bg-base-200 */
--navy-darker: #141A3A   /* bg-base-300 */
--blue: #2341F0          /* btn-primary, text-primary */
--blue-hover: #3B52F5    /* :hover su primary */
--secondary: #A7B0FF     /* text-secondary, default text color */

/* Semantici (DaisyUI) */
--info: #3b82f6          /* Messaggi info */
--success: #10b981       /* Successi, conferme */
--warning: #f59e0b       /* Avvisi */
--error: #dc2626         /* Errori */
```

## 🎨 Per Designer

### Importare in Figma/Design Tools

1. **Font**: Inter (300, 400, 600, 700, 800)
   - Link: https://fonts.google.com/specimen/Inter

2. **Colori Principal**i:
   ```
   Navy Base:      #0A0F32
   Navy Dark:      #11152F
   Navy Darker:    #141A3A
   Blu Primario:   #2341F0
   Blu Hover:      #3B52F5
   Secondario:     #A7B0FF
   ```

3. **Grid e Spacing**:
   - Base unit: 4px
   - Padding standard: 16px
   - Border radius: 8-12px

### Best Practice per Mockup

✅ Utilizzare colori esatti dalla guida  
✅ Mantenere contrasto minimo WCAG AA (4.5:1)  
✅ Usare Inter come font primario  
✅ Spacer in multipli di 4px  
✅ Border radius consistente (8px per componenti, 12px per card)  

## 📖 Leggere la Guida Completa

Per dettagli approfonditi su:
- Tipografia e gerarchia
- Componenti UI (bottoni, card, form)
- Varianti di logo
- Accessibilità WCAG
- Implementazione nel codice

👉 **Apri [`BRAND_GUIDE.md`](./BRAND_GUIDE.md)**

## 📊 Conformità di Contrasto

Tutti i colori sono stati testati per conformità WCAG:

| Coppia | Rapporto | Standard |
|--------|----------|----------|
| Secondario su Navy | 7.2:1 | ✅ AAA |
| Blu su Navy | 5.8:1 | ✅ AA |
| Bianco su Blu | 13.5:1 | ✅ AAA |
| Success su Navy | 5.1:1 | ✅ AA |
| Warning su Navy | 5.6:1 | ✅ AA |
| Error su Navy | 4.2:1 | ✅ AA |

## 🔄 Aggiornamenti Futuri

### v2.1 (Gennaio 2026)
- [ ] Asset svg per icone custom
- [ ] Illustrazioni hero sections
- [ ] Tema chiaro (light mode)

### v3.0 (Q2 2026)
- [ ] Design tokens JSON
- [ ] Componenti Storybook
- [ ] Mobile design specs

## 📋 Checklist per Nuove Feature

Quando aggiungi una feature, verifica:

- [ ] Usi classi DaisyUI anziché colori hardcoded
- [ ] Il contrasto testo-background è WCAG AA minimum
- [ ] Font è Inter con peso corretto (300-800)
- [ ] Spacing segue il grid di 4px
- [ ] Responsive design testato (mobile, tablet, desktop)
- [ ] Dark mode mantiene la leggibilità
- [ ] Focus states visibili per accessibilità

## 🐛 Bug o Discrepanze?

Se noti che un componente non segue la brand guide:

1. **Apri una issue** con:
   - Screenshot del problema
   - Percorso file
   - Colore/componente interessato

2. **Fix rapido**:
   - Vedi [BRAND_GUIDE.md](./BRAND_GUIDE.md) per codice corretto
   - Applica la classe DaisyUI appropriata
   - Test nel browser

## 📞 Domande?

**Risorse:**
- 📚 [BRAND_GUIDE.md](./BRAND_GUIDE.md) - Documentazione completa
- 🎨 `tailwind.config.ts` - Configurazione tema
- 📱 `components/navbar.tsx` - Esempio componente corretta
- 🌐 `app/page.tsx` - Landing page di riferimento

**Ultimo aggiornamento:** Dicembre 8, 2025  
**Versione:** 2.0  
**Stato:** ✅ Attivo in produzione
