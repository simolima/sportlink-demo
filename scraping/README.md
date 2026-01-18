# Web Scraping CONI - Società Sportive Italiane

Progetto di web scraping per estrarre i dati delle società sportive dal Registro CONI.

## Obiettivo

Estrarre tutte le società sportive italiane registrate presso CONI per:
- **Sport**: Calcio (FIGC), Pallavolo (FIPAV), Basket (FIP), CSI
- **Copertura**: Tutte le regioni e province italiane

## Dati Estratti

Per ogni società:
- Denominazione
- Regione
- Provincia
- Città/Comune
- Sport (calcio/pallavolo/basket)
- Organismo sportivo (FIGC/FIPAV/FIP/CSI)

## Setup

1. Installa Python 3.8+ se non presente
2. Installa le dipendenze:
```bash
pip install -r requirements.txt
playwright install chromium
```

## Utilizzo

```bash
# Scraping completo (tutte le regioni)
python scrape_coni.py

# Test su una singola regione
python scrape_coni.py --region "Lombardia"

# Test su una singola provincia
python scrape_coni.py --region "Lombardia" --province "Milano"
```

## Output

I dati vengono salvati in:
- `output/societa_sportive.csv` - File CSV principale
- `output/societa_sportive.json` - File JSON dettagliato
- `output/logs/` - Log di esecuzione

## Note Tecniche

- Usa Playwright per gestire i dropdown dinamici
- Implementa retry logic per gestire timeout
- Salva progressi incrementali per evitare perdita dati
- Rispetta rate limiting per non sovraccaricare il server
