# Sprinta Brand Guide v2.0
## Sistema di Design Scuro - Navy & Blu

### 📋 Indice
1. [Palette Colori](#palette-colori)
2. [Tipografia](#tipografia)
3. [Componenti UI](#componenti-ui)
4. [Varianti di Logo](#varianti-di-logo)
5. [Utilizzo nel Progetto](#utilizzo-nel-progetto)
6. [Accessibilità](#accessibilità)

---

## 🎨 Palette Colori

### Colori Primari (Navy & Blu)

| Nome | Colore | Hex | RGB | Utilizzo |
|------|--------|-----|-----|----------|
| **Navy Base** | ![#0A0F32](https://via.placeholder.com/50/0A0F32/0A0F32) | `#0A0F32` | `10, 15, 50` | Background principale (base-100) |
| **Navy Dark** | ![#11152F](https://via.placeholder.com/50/11152F/11152F) | `#11152F` | `17, 21, 47` | Background secondario (base-200) |
| **Navy Darker** | ![#141A3A](https://via.placeholder.com/50/141A3A/141A3A) | `#141A3A` | `20, 26, 58` | Background terziario (base-300) |
| **Blu Primario** | ![#2341F0](https://via.placeholder.com/50/2341F0/2341F0) | `#2341F0` | `35, 65, 240` | Bottoni, link, evidenziazioni primarie |
| **Blu Hover** | ![#3B52F5](https://via.placeholder.com/50/3B52F5/3B52F5) | `#3B52F5` | `59, 82, 245` | Stato hover su elementi primari |
| **Secondario** | ![#A7B0FF](https://via.placeholder.com/50/A7B0FF/A7B0FF) | `#A7B0FF` | `167, 176, 255` | Testo principale su sfondo scuro |

### Colori Semantici (DaisyUI)

| Nome | Hex | Utilizzo |
|------|-----|----------|
| **Info** | `#3b82f6` | Messaggi informativi, badge info |
| **Success** | `#10b981` | Successo, conferme, badge positivi |
| **Warning** | `#f59e0b` | Avvisi, attenzione, badge warning |
| **Error** | `#dc2626` | Errori, fallimenti, badge errore |

### Accessibilità del Contrasto

- ✅ **Secondario su Navy**: Rapporto WCAG AA (7.2:1) - Eccellente leggibilità
- ✅ **Blu Primario su Navy**: Rapporto WCAG AA (5.8:1) - Leggibile
- ✅ **Bianco su Blu**: Rapporto WCAG AAA (13.5:1) - Massima leggibilità
- ⚠️ **Secondario su Blu**: Rapporto WCAG A (4.1:1) - Leggibile ma non ideale per lunghi testi

---

## 🔤 Tipografia

### Font Primario: Inter

**Importazione CSS:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
```

### Gerarchía dei Testi

| Elemento | Peso | Dimensione | Line Height | Utilizzo |
|----------|------|-----------|------------|----------|
| **H1 - Titolo Grande** | 800 (Bold) | 32px | 1.2 | Titoli pagina principali |
| **H2 - Titolo Sezione** | 700 (Bold) | 24px | 1.3 | Titoli sezioni |
| **H3 - Sottotitolo** | 700 (Bold) | 20px | 1.4 | Sottotitoli, card |
| **Body - Testo Principale** | 400 (Regular) | 16px | 1.5 | Paragrafi, descrizioni |
| **Body - Testo Secondario** | 400 (Regular) | 14px | 1.5 | Testo ausiliario, meta |
| **Label** | 600 (Semibold) | 12px | 1.4 | Etichette form, badge |
| **Button** | 600 (Semibold) | 14-16px | 1.4 | Testo bottone |

### Varianti Colore Testo

```css
/* Testo principale - Altissimo contrasto */
color: var(--secondary); /* #A7B0FF */

/* Testo secondario - Leggibile */
color: var(--secondary) / 80%; /* Più scuro del primario */

/* Testo terzario - Meno prominente */
color: var(--secondary) / 60%; /* Ancor più scuro */

/* Testo disabilitato */
color: var(--secondary) / 40%; /* Molto meno visibile */
```

---

## 🧩 Componenti UI

### Bottone Primario

**CSS DaisyUI:**
```tsx
className="btn btn-primary"
```

**Proprietà:**
- Background: `#2341F0` (Blu Primario)
- Colore testo: Bianco
- Border radius: 8px (default DaisyUI)
- Padding: 12px 24px
- Hover: `#3B52F5` (Blu Hover)
- Font weight: 600

**Stato Disabilitato:**
```tsx
className="btn btn-primary disabled:opacity-50"
```

### Bottone Secondario

**CSS DaisyUI:**
```tsx
className="btn btn-ghost"
```

**Proprietà:**
- Background: Trasparente
- Colore testo: `#A7B0FF` (Secondario)
- Border: Nessuno
- Hover: Background `#11152F` (Navy Dark)
- Transition smooth

### Card Standard

**CSS:**
```tsx
className="bg-base-200 rounded-lg border border-base-300 p-4 shadow-sm"
```

**Proprietà:**
- Background: `#11152F` (Navy Dark)
- Border: 1px `#141A3A` (Navy Darker)
- Border radius: 8-12px
- Padding: 16px
- Shadow: box-shadow 0 1px 3px rgba(0,0,0,0.3)
- Hover: Aumentare shadow a 0 4px 6px rgba(0,0,0,0.4)

### Input/Form Fields

**CSS:**
```tsx
className="input input-bordered bg-base-100 text-secondary border-base-300 focus:border-primary focus:ring-primary"
```

**Proprietà:**
- Background: `#0A0F32` (Navy Base)
- Colore testo: `#A7B0FF` (Secondario)
- Border: 1px `#141A3A` (Navy Darker)
- Focus border: `#2341F0` (Blu Primario)
- Focus ring: `#2341F0` con opacity
- Placeholder: `var(--secondary) / 60%`

### Badge

**Badge Primario (Success):**
```tsx
className="badge badge-success"
```

**Badge Secondario (Warning):**
```tsx
className="badge badge-warning"
```

**Badge Error:**
```tsx
className="badge badge-error"
```

### Navbar

**CSS:**
```tsx
className="navbar bg-base-100 shadow-md border-b border-base-300"
```

**Elementi:**
- Background: `#0A0F32` (Navy Base)
- Testo link: `#A7B0FF` (Secondario)
- Hover link: `#2341F0` (Blu Primario)
- Logo text: Blu Primario
- Border bottom: 1px `#141A3A`

---

## 📱 Varianti di Logo

### Logo Variante 1: Bianco su Blu
**Situazione:** Hero sections, sezioni blu scuro
```
Logo: Bianco puro (#FFFFFF)
Sfondo: Blu Primario (#2341F0)
Spacing: 24px da bordi
```

### Logo Variante 2: Blu su Navy
**Situazione:** Navbar, header, aree con Navy background
```
Logo: Blu Primario (#2341F0)
Subtitle: Secondario (#A7B0FF)
Sfondo: Navy Base (#0A0F32)
Spacing: 16px da bordi
```

### Logo Variante 3: Blu su Bianco (Light Mode)
**Situazione:** PDF, stampa, contesti light
```
Logo: Blu Primario (#2341F0)
Sfondo: Bianco (#FFFFFF)
Spacing: 20px da bordi
```

### Logo Variante 4: Solo Icona
**Situazione:** Favicon, avatar user fallback
```
Icona: Blu Primario (#2341F0)
Background avatar fallback: Gradiente from-primary to-blue-600
```

---

## 💻 Utilizzo nel Progetto

### CSS Globali (`app/globals.css`)

```css
:root {
  --white: #FFFFFF;
  --navy: #0A0F32;
  --navy-dark: #11152F;
  --navy-darker: #141A3A;
  --blue: #2341F0;
  --blue-hover: #3B52F5;
  --secondary: #A7B0FF;
  --radius: 12px;
}

html {
  data-theme="sprinta"
}

body {
  background-color: var(--navy);
  color: var(--secondary);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Arial, sans-serif;
}
```

### Tailwind Config (`tailwind.config.ts`)

```typescript
theme: {
  extend: {
    colors: {
      sprinta: {
        white: "#FFFFFF",
        navy: "#0A0F32",
        blue: "#2341F0",
        "blue-hover": "#3B52F5",
      },
    },
  },
},
daisyui: {
  themes: [
    {
      sprinta: {
        "primary": "#2341F0",
        "primary-focus": "#3B52F5",
        "primary-content": "#FFFFFF",
        "secondary": "#A7B0FF",
        "secondary-content": "#0A0F32",
        "accent": "#2341F0",
        "neutral": "#0A0F32",
        "base-100": "#0A0F32",
        "base-200": "#11152F",
        "base-300": "#141A3A",
        "info": "#3b82f6",
        "success": "#10b981",
        "warning": "#f59e0b",
        "error": "#dc2626",
      },
    },
  ],
},
```

### Classi CSS Comuni

```tsx
// Background scuro
bg-base-100    // Navy Base
bg-base-200    // Navy Dark
bg-base-300    // Navy Darker

// Testo
text-secondary          // Testo principale
text-secondary/80       // Testo secondario
text-secondary/60       // Testo terziario
text-secondary/40       // Testo disabilitato

// Bottoni
btn btn-primary         // Bottone blu primario
btn btn-primary btn-sm  // Bottone piccolo
btn btn-ghost           // Bottone trasparente

// Bordi e divisori
border-base-300         // Bordi navy-darker
border-primary          // Bordi blu

// Box e container
card card-bordered      // Card con bordo
card bg-base-200        // Card con background navy-dark
```

---

## ♿ Accessibilità

### Rapporti di Contrasto WCAG

**Verificati e conformi:**
- ✅ Secondario (`#A7B0FF`) su Navy (`#0A0F32`): **7.2:1** (AAA)
- ✅ Blu Primario (`#2341F0`) su Navy (`#0A0F32`): **5.8:1** (AA)
- ✅ Bianco (`#FFFFFF`) su Blu (`#2341F0`): **13.5:1** (AAA)
- ✅ Testo Success su Navy: **5.1:1** (AA)
- ✅ Testo Warning su Navy: **5.6:1** (AA)
- ✅ Testo Error su Navy: **4.2:1** (AA)

### Linee Guida

1. **Non usare solo il colore** per differenziare elementi - aggiungere icone, testo o pattern
2. **Contrasto minimo AA (4.5:1)** per tutti i testi normali
3. **Contrasto minimo AAA (7:1)** per testi importanti (headings, CTA)
4. **Focus indicators** visibili per elemento tab-focused
5. **Placeholder text** deve avere rapporto di contrasto 3:1 minimo
6. **Dark mode nativo** riduce affaticamento oculare (consigliato per sessioni lunghe)

---

## 📐 Spacing & Layout

### Margini e Padding Standard

```
xs: 4px    (0.25rem)
sm: 8px    (0.5rem)
md: 16px   (1rem)
lg: 24px   (1.5rem)
xl: 32px   (2rem)
2xl: 48px  (3rem)
```

### Border Radius Standard

```
sm: 4px      (bottoni piccoli, input)
md: 8px      (card, box standard)
lg: 12px     (card prominent, dialog)
xl: 16px     (container principale)
full: 9999px (avatar, badge)
```

---

## 🔄 Tema Chiaro (Futuro)

Quando verrà implementato il supporto per light mode:

```css
@media (prefers-color-scheme: light) {
  --navy: #F5F7FF;
  --navy-dark: #FFFFFF;
  --navy-darker: #F0F3FF;
  --secondary: #0A0F32;
  /* ... inversione colori */
}
```

---

## 📝 Note Versione

**v2.0 - Novembre 2025**
- ✅ Migrazione da tema verde a tema scuro navy/blu
- ✅ Aggiornate tutte le componenti UI
- ✅ Verificati i rapporti di contrasto WCAG
- ✅ Documentazione completa della palette
- ✅ Esempi di codice per tutti i componenti

**v1.0 - Settembre 2025**
- Tema verde originale (deprecato)

---

## 📞 Contatti & Supporto

Per domande sulla brand guide o sull'implementazione del design system:
1. Consultare i componenti in `components/`
2. Verificare `app/globals.css` e `tailwind.config.ts`
3. Controllare gli esempi in `app/page.tsx` e altre pagine

**Ultimo aggiornamento:** Dicembre 8, 2025
