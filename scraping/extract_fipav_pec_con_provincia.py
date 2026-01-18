import pdfplumber
import csv
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

pdf_path = r'output\archivio-societa-affiliate-pec.pdf'

# Codici regionali FIPAV
REGIONI_MAP = {
    '1': 'Piemonte', '2': 'Valle d\'Aosta', '3': 'Liguria', '4': 'Lombardia',
    '5': 'Veneto', '6': 'Friuli-Venezia Giulia', '7': 'Emilia-Romagna', '8': 'Toscana',
    '9': 'Umbria', '10': 'Marche', '11': 'Lazio', '12': 'Abruzzo',
    '13': 'Molise', '14': 'Campania', '15': 'Puglia', '16': 'Basilicata',
    '17': 'Calabria', '18': 'Sicilia', '19': 'Sardegna'
}

# Mapping codici provincia FIPAV (estratto dal registro CONI)
# Formato: (regione_code, provincia_code) -> sigla_provincia
PROVINCIA_MAP = {
    # Piemonte (1)
    ('1', '1'): 'AL', ('1', '2'): 'AT', ('1', '3'): 'CN', ('1', '4'): 'NO', 
    ('1', '5'): 'TO', ('1', '97'): 'BI', ('1', '103'): 'VB',
    # Valle d'Aosta (2)
    ('2', '7'): 'AO',
    # Liguria (3)
    ('3', '8'): 'GE', ('3', '9'): 'IM', ('3', '10'): 'SP', ('3', '11'): 'SV', ('3', '104'): 'GE',
    # Lombardia (4)
    ('4', '10'): 'LO', ('4', '12'): 'BG', ('4', '13'): 'BS', ('4', '14'): 'CO', 
    ('4', '15'): 'CR', ('4', '16'): 'LC', ('4', '17'): 'LO', ('4', '18'): 'MI', 
    ('4', '19'): 'MN', ('4', '20'): 'PV', ('4', '21'): 'SO', ('4', '108'): 'BG',
    # Veneto (5)
    ('5', '22'): 'BL', ('5', '23'): 'PD', ('5', '24'): 'RO', ('5', '25'): 'TV', 
    ('5', '26'): 'VE', ('5', '27'): 'VI', ('5', '28'): 'VR',
    # Friuli-Venezia Giulia (6)
    ('6', '29'): 'GO', ('6', '30'): 'PN', ('6', '31'): 'TS', ('6', '32'): 'UD',
    # Emilia-Romagna (7)
    ('7', '33'): 'BO', ('7', '34'): 'FC', ('7', '35'): 'FE', ('7', '36'): 'FO', 
    ('7', '37'): 'MO', ('7', '38'): 'PR', ('7', '39'): 'RA', ('7', '40'): 'RE', ('7', '41'): 'RN',
    # Toscana (8)
    ('8', '42'): 'AR', ('8', '43'): 'FI', ('8', '44'): 'GR', ('8', '45'): 'LI', 
    ('8', '46'): 'LU', ('8', '47'): 'MS', ('8', '48'): 'PI', ('8', '49'): 'PT', ('8', '50'): 'SI',
    # Umbria (9)
    ('9', '51'): 'PG', ('9', '52'): 'TR',
    # Marche (10)
    ('10', '53'): 'AN', ('10', '54'): 'AP', ('10', '55'): 'MC', ('10', '56'): 'PU',
    # Lazio (11)
    ('11', '57'): 'FR', ('11', '58'): 'LT', ('11', '59'): 'RI', ('11', '60'): 'RM', ('11', '61'): 'VT',
    # Abruzzo (12)
    ('12', '62'): 'AQ', ('12', '63'): 'CH', ('12', '64'): 'PE', ('12', '65'): 'TE',
    # Molise (13)
    ('13', '70'): 'CB', ('13', '71'): 'IS',
    # Campania (14)
    ('14', '66'): 'AV', ('14', '67'): 'BN', ('14', '68'): 'CE', ('14', '69'): 'NA', ('14', '72'): 'SA',
    # Puglia (15)
    ('15', '73'): 'BA', ('15', '74'): 'BT', ('15', '75'): 'BR', ('15', '76'): 'FG', ('15', '77'): 'LE', ('15', '78'): 'TA',
    # Basilicata (16)
    ('16', '79'): 'MT', ('16', '80'): 'PZ',
    # Calabria (17)
    ('17', '81'): 'CS', ('17', '82'): 'CZ', ('17', '83'): 'KR', ('17', '84'): 'RC', ('17', '85'): 'VV',
    # Sicilia (18)
    ('18', '86'): 'AG', ('18', '87'): 'CL', ('18', '88'): 'CT', ('18', '89'): 'EN', 
    ('18', '90'): 'ME', ('18', '91'): 'PA', ('18', '92'): 'RG', ('18', '93'): 'SR', ('18', '94'): 'TP',
    # Sardegna (19)
    ('19', '95'): 'CA', ('19', '96'): 'NU', ('19', '104'): 'OT', ('19', '105'): 'SS',
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
                            
                            # Lookup sigla provincia dal mapping
                            provincia_key = (regione_code, provincia_code)
                            provincia = PROVINCIA_MAP.get(provincia_key, provincia_code)
                            
                            societa_pec.append({
                                'denominazione': denominazione,
                                'provincia_code': provincia_code,
                                'provincia': provincia,
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
    csv_path = Path('output') / f'societa_FIPAV_PEC_CON_PROVINCIA_{timestamp}.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=societa_pec_unique[0].keys())
        writer.writeheader()
        writer.writerows(societa_pec_unique)
    print(f'Salvato: {csv_path}')
    
    # Salva JSON
    json_path = Path('output') / f'societa_FIPAV_PEC_CON_PROVINCIA_{timestamp}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(societa_pec_unique, f, ensure_ascii=False, indent=2)
    print(f'Salvato: {json_path}')
    
    # Statistiche
    print()
    print('Campione di record:')
    for s in societa_pec_unique[:10]:
        print(f'  {s["denominazione"][:40]} - {s["provincia"]} ({s["regione"]})')
