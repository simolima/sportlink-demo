import json
import csv
from pathlib import Path
from datetime import datetime

# Carica il file FIPAV PEC COMPLETO (il più completo con 3.796 società)
input_json = Path('output/societa_FIPAV_PEC_COMPLETO_20260118_235740.json')

with open(input_json, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Riordina e allinea i campi al formato FIGC/FIP
societa_pallavolo = []
for record in data:
    societa_allineata = {
        'denominazione': record.get('denominazione', ''),
        'regione': record.get('regione', ''),
        'provincia': record.get('provincia', ''),
        'comune': '',  # Vuoto come richiesto
        'organismo': 'FIPAV',
        'sport': 'Pallavolo',
        'affiliazione_completa': 'FIPAV'
    }
    societa_pallavolo.append(societa_allineata)

print(f'Totale società pallavolo allineate: {len(societa_pallavolo)}')

# Salva JSON allineato
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
json_path = Path('output') / f'societa_PALLAVOLO_FINAL_{timestamp}.json'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(societa_pallavolo, f, ensure_ascii=False, indent=2)
print(f'Salvato: {json_path}')

# Salva CSV allineato
csv_path = Path('output') / f'societa_PALLAVOLO_FINAL_{timestamp}.csv'
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=societa_pallavolo[0].keys())
    writer.writeheader()
    writer.writerows(societa_pallavolo)
print(f'Salvato: {csv_path}')

# Mostra confronto con gli altri file
print()
print('RIEPILOGO FILE FINALI:')
print(f'  societa_FIGC: 8.988 società')
print(f'  societa_FIP: 2.971 società')
print(f'  societa_CSI: 6.520 società')
print(f'  societa_PALLAVOLO: {len(societa_pallavolo)} società ← NUOVO')
print()
print('Primo record allineato:')
print(json.dumps(societa_pallavolo[0], indent=2, ensure_ascii=False))
