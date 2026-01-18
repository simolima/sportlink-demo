import pdfplumber
import csv
import json
from pathlib import Path
from datetime import datetime

pdf_path = r'output\Elenco per sito.pdf'

# Codici regionali FIPAV
REGIONI_MAP = {
    '1': 'Piemonte', '2': 'Valle d\'Aosta', '3': 'Liguria', '4': 'Lombardia',
    '5': 'Veneto', '6': 'Friuli-Venezia Giulia', '7': 'Emilia-Romagna', '8': 'Toscana',
    '9': 'Umbria', '10': 'Marche', '11': 'Lazio', '12': 'Abruzzo',
    '13': 'Molise', '14': 'Campania', '15': 'Puglia', '16': 'Basilicata',
    '17': 'Calabria', '18': 'Sicilia', '19': 'Sardegna'
}

scuole = []

with pdfplumber.open(pdf_path) as pdf:
    print(f'Lettura {len(pdf.pages)} pagine...')
    
    for page_num, page in enumerate(pdf.pages, 1):
        # Estrai tabelle
        tables = page.extract_tables()
        
        if tables:
            for table in tables:
                for row in table:
                    if row and len(row) >= 4:
                        try:
                            # Le colonne sono: Codice, Denominazione, Comune, Provincia
                            cell1 = str(row[0] or '').strip()
                            cell2 = str(row[1] or '').strip()
                            cell3 = str(row[2] or '').strip()
                            cell4 = str(row[3] or '').strip()
                            
                            # Skip header
                            if 'Denominazione' in cell1 or 'Società' in cell1:
                                continue
                            
                            # Check se è un record valido (inizia con numero)
                            parts = cell2.split()
                            if not parts or not cell3 or not cell4:
                                continue
                            
                            denominazione = cell2.strip()
                            comune = cell3.strip()
                            provincia = cell4.strip()
                            
                            # Estrai codice regione dalle prime celle
                            codice_regione = cell1.split()[0] if cell1.split() else ''
                            
                            regione = REGIONI_MAP.get(codice_regione, f'Regione {codice_regione}')
                            
                            scuole.append({
                                'denominazione': denominazione,
                                'comune': comune,
                                'provincia': provincia,
                                'regione': regione,
                                'organismo': 'FIPAV',
                                'sport': 'Pallavolo'
                            })
                        except:
                            continue

print(f'Trovate {len(scuole)} scuole federali FIPAV')

# Rimuovi duplicati
scuole_unique = []
seen = set()
for s in scuole:
    key = (s['denominazione'], s['comune'], s['provincia'])
    if key not in seen:
        seen.add(key)
        scuole_unique.append(s)

print(f'Dopo deduplicazione: {len(scuole_unique)} scuole')

if scuole_unique:
    # Salva CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    csv_path = Path('output') / f'scuole_federali_FIPAV_{timestamp}.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=scuole_unique[0].keys())
        writer.writeheader()
        writer.writerows(scuole_unique)
    print(f'Salvato: {csv_path}')
    
    # Salva JSON
    json_path = Path('output') / f'scuole_federali_FIPAV_{timestamp}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(scuole_unique, f, ensure_ascii=False, indent=2)
    print(f'Salvato: {json_path}')
    
    # Statistiche
    print()
    print('Statistiche per regione:')
    by_region = {}
    for s in scuole_unique:
        reg = s['regione']
        by_region[reg] = by_region.get(reg, 0) + 1
    
    for regione in sorted(by_region.keys()):
        print(f'  {regione}: {by_region[regione]}')
