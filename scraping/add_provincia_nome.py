import json
from pathlib import Path
from datetime import datetime

# Mapping sigla -> nome provincia
SIGLA_TO_NOME = {
    'AL': 'Alessandria', 'AT': 'Asti', 'BI': 'Biella', 'CN': 'Cuneo', 'NO': 'Novara', 
    'TO': 'Torino', 'VB': 'Verbano-Cusio-Ossola', 'AO': 'Aosta',
    'GE': 'Genova', 'IM': 'Imperia', 'SP': 'La Spezia', 'SV': 'Savona',
    'BG': 'Bergamo', 'BS': 'Brescia', 'CO': 'Como', 'CR': 'Cremona', 
    'LC': 'Lecco', 'LO': 'Lodi', 'MI': 'Milano', 'MN': 'Mantova', 
    'PV': 'Pavia', 'SO': 'Sondrio',
    'BL': 'Belluno', 'PD': 'Padova', 'RO': 'Rovigo', 'TV': 'Treviso', 
    'VE': 'Venezia', 'VI': 'Vicenza', 'VR': 'Verona',
    'GO': 'Gorizia', 'PN': 'Pordenone', 'TS': 'Trieste', 'UD': 'Udine',
    'BO': 'Bologna', 'FC': 'Forlì-Cesena', 'FE': 'Ferrara', 'FO': 'Forlì', 
    'MO': 'Modena', 'PR': 'Parma', 'RA': 'Ravenna', 'RE': 'Reggio Emilia', 'RN': 'Rimini',
    'AR': 'Arezzo', 'FI': 'Firenze', 'GR': 'Grosseto', 'LI': 'Livorno', 
    'LU': 'Lucca', 'MS': 'Massa-Carrara', 'PI': 'Pisa', 'PT': 'Pistoia', 'SI': 'Siena',
    'PG': 'Perugia', 'TR': 'Terni',
    'AN': 'Ancona', 'AP': 'Ascoli Piceno', 'MC': 'Macerata', 'PU': 'Pesaro-Urbino',
    'FR': 'Frosinone', 'LT': 'Latina', 'RI': 'Rieti', 'RM': 'Roma', 'VT': 'Viterbo',
    'AQ': 'L\'Aquila', 'CH': 'Chieti', 'PE': 'Pescara', 'TE': 'Teramo',
    'CB': 'Campobasso', 'IS': 'Isernia',
    'AV': 'Avellino', 'BN': 'Benevento', 'CE': 'Caserta', 'NA': 'Napoli', 'SA': 'Salerno',
    'BA': 'Bari', 'BT': 'Barletta-Andria-Trani', 'BR': 'Brindisi', 'FG': 'Foggia', 
    'LE': 'Lecce', 'TA': 'Taranto',
    'MT': 'Matera', 'PZ': 'Potenza',
    'CS': 'Cosenza', 'CZ': 'Catanzaro', 'KR': 'Crotone', 'RC': 'Reggio Calabria', 'VV': 'Vibo Valentia',
    'AG': 'Agrigento', 'CL': 'Caltanissetta', 'CT': 'Catania', 'EN': 'Enna', 
    'ME': 'Messina', 'PA': 'Palermo', 'RG': 'Ragusa', 'SR': 'Siracusa', 'TP': 'Trapani',
    'CA': 'Cagliari', 'NU': 'Nuoro', 'OT': 'Olbia-Tempio', 'SS': 'Sassari',
}

# Carica il JSON FIPAV PEC
input_json = Path('output/societa_FIPAV_PEC_CON_PROVINCIA_20260118_235616.json')

with open(input_json, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Aggiungi nome provincia per esteso
for record in data:
    sigla = record.get('provincia', '')
    record['provincia_nome'] = SIGLA_TO_NOME.get(sigla, sigla)

# Salva il file aggiornato
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
output_json = Path('output') / f'societa_FIPAV_PEC_COMPLETO_{timestamp}.json'

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Salvato: {output_json}')

# Salva anche CSV con tutte le colonne
import csv
output_csv = Path('output') / f'societa_FIPAV_PEC_COMPLETO_{timestamp}.csv'

with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['denominazione', 'provincia_code', 'provincia', 'provincia_nome', 'regione', 'pec', 'organismo', 'sport']
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(data)

print(f'Salvato: {output_csv}')

# Mostra campione
print()
print('CAMPIONE:')
for record in data[:5]:
    print(f"  {record['denominazione'][:40]}")
    print(f"    {record['provincia']} - {record['provincia_nome']} ({record['regione']})")
