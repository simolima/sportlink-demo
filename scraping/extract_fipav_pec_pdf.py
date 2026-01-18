import pdfplumber
import csv
import json
from pathlib import Path
from datetime import datetime

pdf_path = r'output\archivio-societa-affiliate-pec.pdf'

# Codici regionali FIPAV
REGIONI_MAP = {
    '1': 'Piemonte', '2': 'Valle d\'Aosta', '3': 'Liguria', '4': 'Lombardia',
    '5': 'Veneto', '6': 'Friuli-Venezia Giulia', '7': 'Emilia-Romagna', '8': 'Toscana',
    '9': 'Umbria', '10': 'Marche', '11': 'Lazio', '12': 'Abruzzo',
    '13': 'Molise', '14': 'Campania', '15': 'Puglia', '16': 'Basilicata',
    '17': 'Calabria', '18': 'Sicilia', '19': 'Sardegna'
}

societa_pec = []

with pdfplumber.open(pdf_path) as pdf:
    print(f'Lettura {len(pdf.pages)} pagine...')
    
    for page_num, page in enumerate(pdf.pages, 1):
        # Estrai tabelle
        tables = page.extract_tables()
        
        if tables:
            for table in tables:
                for row in table:
                    if row and len(row) >= 5:
                        try:
                            cell1 = str(row[0] or '').strip()
                            cell2 = str(row[1] or '').strip()
                            cell3 = str(row[2] or '').strip()
                            cell4 = str(row[3] or '').strip()
                            cell5 = str(row[4] or '').strip()
                            
                            # Skip header
                            if 'Regione' in cell1 or 'PEC' in cell5:
                                continue
                            
                            # Check se è un record valido
                            if not cell1 or not cell4 or not cell5:
                                continue
                            
                            denominazione = cell4.strip()
                            pec = cell5.strip()
                            
                            # Skip se non è una PEC
                            if '@' not in pec:
                                continue
                            
                            regione_code = cell1.strip()
                            provincia_code = cell2.strip()
                            
                            regione = REGIONI_MAP.get(regione_code, f'Regione {regione_code}')
                            
                            societa_pec.append({
                                'denominazione': denominazione,
                                'regione': regione,
                                'pec': pec,
                                'organismo': 'FIPAV',
                                'sport': 'Pallavolo'
                            })
                        except:
                            continue

print(f'Trovate {len(societa_pec)} società con indirizzo PEC')

# Rimuovi duplicati
societa_pec_unique = []
seen = set()
for s in societa_pec:
    key = (s['denominazione'], s['pec'])
    if key not in seen:
        seen.add(key)
        societa_pec_unique.append(s)

print(f'Dopo deduplicazione: {len(societa_pec_unique)} società')

if societa_pec_unique:
    # Salva CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    csv_path = Path('output') / f'societa_FIPAV_PEC_{timestamp}.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=societa_pec_unique[0].keys())
        writer.writeheader()
        writer.writerows(societa_pec_unique)
    print(f'Salvato: {csv_path}')
    
    # Salva JSON
    json_path = Path('output') / f'societa_FIPAV_PEC_{timestamp}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(societa_pec_unique, f, ensure_ascii=False, indent=2)
    print(f'Salvato: {json_path}')
    
    # Statistiche
    print()
    print('Statistiche per regione:')
    by_region = {}
    for s in societa_pec_unique:
        reg = s['regione']
        by_region[reg] = by_region.get(reg, 0) + 1
    
    for regione in sorted(by_region.keys()):
        print(f'  {regione}: {by_region[regione]}')
