import json
import csv
from pathlib import Path
from datetime import datetime

# Carica il file tutte le società (ha gli stessi dati del checkpoint)
with open('output/societa_italia_tutte_20260118_222300.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Estrai società con VOLLEY o PALLAVOLO nel nome
pallavolo_coni = []
for record in data:
    denom = record.get('denominazione', '').upper()
    if 'VOLLEY' in denom or 'PALLAVOLO' in denom:
        nuovo = {
            'denominazione': record.get('denominazione', ''),
            'regione': record.get('regione', ''),
            'provincia': record.get('provincia', ''),
            'comune': record.get('comune', ''),
            'organismo': 'PALLAVOLO',
            'sport': 'Pallavolo',
            'affiliazione_completa': record.get('affiliazione_completa', '')
        }
        pallavolo_coni.append(nuovo)

print(f'Società di pallavolo dal registro CONI (per nome): {len(pallavolo_coni)}')

# Salva JSON
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
json_path = Path('output') / f'societa_PALLAVOLO_CONI_{timestamp}.json'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(pallavolo_coni, f, ensure_ascii=False, indent=2)
print(f'Salvato: {json_path}')

# Salva CSV
csv_path = Path('output') / f'societa_PALLAVOLO_CONI_{timestamp}.csv'
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=pallavolo_coni[0].keys())
    writer.writeheader()
    writer.writerows(pallavolo_coni)
print(f'Salvato: {csv_path}')

# Mostra campione
print()
print('Campione:')
for s in pallavolo_coni[:5]:
    print(f"  {s['denominazione'][:50]} - {s['provincia']}")
