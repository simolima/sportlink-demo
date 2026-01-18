"""
Scraping COMPLETO di tutte le società sportive italiane dal registro CONI
Stima: 1544 pagine × ~4 sec = ~100 minuti

Features:
- Salvataggio ogni 50 pagine (checkpoint)
- Ripresa automatica da ultimo checkpoint
- Log dettagliato
- Filtro per organismi target (FIGC, FIPAV, FIP, CSI)
"""

import asyncio
import csv
import json
import logging
import os
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright

# Configurazione
ORGANISMI_TARGET = {'FIGC', 'FIPAV', 'FIP', 'CSI'}
SPORT_MAP = {
    'FIGC': 'Calcio',
    'FIPAV': 'Pallavolo', 
    'FIP': 'Basket',
    'CSI': 'CSI'
}
RISULTATI_PER_PAGINA = 30
SALVA_OGNI_N_PAGINE = 50
MAX_PAGINE = 1600  # Un po' di margine oltre 1544

# Setup logging
Path('output').mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('output/scraping_italia.log', encoding='utf-8', mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def carica_checkpoint():
    """Carica l'ultimo checkpoint se esiste"""
    checkpoint_file = Path('output/checkpoint.json')
    if checkpoint_file.exists():
        with open(checkpoint_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            logger.info(f"📂 Checkpoint trovato: pagina {data['ultima_pagina']}, {len(data['risultati'])} società")
            return data
    return {'ultima_pagina': 0, 'risultati': []}


def salva_checkpoint(pagina: int, risultati: list):
    """Salva checkpoint per ripresa"""
    checkpoint_file = Path('output/checkpoint.json')
    with open(checkpoint_file, 'w', encoding='utf-8') as f:
        json.dump({
            'ultima_pagina': pagina,
            'risultati': risultati,
            'timestamp': datetime.now().isoformat()
        }, f, ensure_ascii=False)
    logger.info(f"💾 Checkpoint salvato: pagina {pagina}, {len(risultati)} società")


def salva_risultati_finali(risultati: list):
    """Salva i risultati finali in CSV e JSON"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Filtra solo organismi target
    risultati_filtrati = [
        r for r in risultati 
        if r.get('organismo') in ORGANISMI_TARGET
    ]
    
    # CSV completo (tutti)
    csv_all = Path('output') / f'societa_italia_tutte_{timestamp}.csv'
    if risultati:
        with open(csv_all, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=risultati[0].keys())
            writer.writeheader()
            writer.writerows(risultati)
        logger.info(f"📄 CSV completo salvato: {csv_all} ({len(risultati)} record)")
    
    # CSV filtrato (solo target)
    csv_filtered = Path('output') / f'societa_italia_target_{timestamp}.csv'
    if risultati_filtrati:
        with open(csv_filtered, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=risultati_filtrati[0].keys())
            writer.writeheader()
            writer.writerows(risultati_filtrati)
        logger.info(f"📄 CSV filtrato salvato: {csv_filtered} ({len(risultati_filtrati)} record)")
    
    # JSON
    json_path = Path('output') / f'societa_italia_target_{timestamp}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(risultati_filtrati, f, ensure_ascii=False, indent=2)
    logger.info(f"📄 JSON salvato: {json_path}")
    
    # Statistiche
    stats = {}
    for r in risultati_filtrati:
        org = r.get('organismo', 'N/A')
        stats[org] = stats.get(org, 0) + 1
    
    logger.info(f"\n📊 STATISTICHE FINALI:")
    logger.info(f"   Totale società estratte: {len(risultati)}")
    logger.info(f"   Società target (FIGC/FIPAV/FIP/CSI): {len(risultati_filtrati)}")
    for org, count in sorted(stats.items()):
        logger.info(f"   - {org}: {count}")
    
    return risultati_filtrati


async def scrape_tutte_le_pagine():
    """Scraping completo di tutte le pagine"""
    
    # Carica checkpoint se esiste
    checkpoint = carica_checkpoint()
    pagina_iniziale = checkpoint['ultima_pagina']
    risultati = checkpoint['risultati']
    
    if pagina_iniziale > 0:
        logger.info(f"🔄 Ripresa da pagina {pagina_iniziale + 1}")
    else:
        logger.info(f"🚀 Inizio scraping completo Italia")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        try:
            # Prima pagina: carica con filtro iniziale per attivare la ricerca
            if pagina_iniziale == 0:
                logger.info("📡 Caricamento pagina iniziale...")
                await page.goto(
                    "https://www.coni.it/it/registro-societa-sportive/home/registro-2-0/registro.html",
                    wait_until='domcontentloaded',
                    timeout=60000
                )
                await asyncio.sleep(1)
                
                # Seleziona una regione qualsiasi per attivare la ricerca
                await page.select_option('select#id_regione', value='3')  # Lombardia
                await asyncio.sleep(1)
                await page.select_option('select#id_provincia', label='Milano')
                await asyncio.sleep(1)
                
                # Submit
                await page.evaluate('document.querySelector("form").submit()')
                await asyncio.sleep(3)
                
                # Verifica che ci siano risultati
                try:
                    await page.wait_for_selector('a.societa', timeout=10000)
                except:
                    logger.error("❌ Nessun risultato trovato nella prima pagina")
                    return []
            
            # Loop su tutte le pagine
            pagina = pagina_iniziale
            pagine_vuote_consecutive = 0
            start_time = datetime.now()
            
            while pagina < MAX_PAGINE:
                pagina += 1
                start = (pagina - 1) * RISULTATI_PER_PAGINA
                
                # Naviga alla pagina (dopo la prima, usa ?start=)
                if pagina > 1 or pagina_iniziale > 0:
                    url = f"https://www.coni.it/it/registro-societa-sportive/home/registro-2-0/registro.html?start={start}"
                    try:
                        await page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        await asyncio.sleep(0.5)
                    except Exception as e:
                        logger.warning(f"⚠️ Errore navigazione pagina {pagina}: {e}")
                        pagine_vuote_consecutive += 1
                        if pagine_vuote_consecutive >= 3:
                            logger.info("🏁 3 errori consecutivi, presumo fine dati")
                            break
                        continue
                
                # Estrai società
                try:
                    await page.wait_for_selector('a.societa', timeout=5000)
                except:
                    pagine_vuote_consecutive += 1
                    if pagine_vuote_consecutive >= 3:
                        logger.info("🏁 3 pagine vuote consecutive, presumo fine dati")
                        break
                    continue
                
                pagine_vuote_consecutive = 0
                societa_links = await page.query_selector_all('a.societa')
                count = len(societa_links)
                
                # Estrai dati
                nuove_societa = 0
                for link in societa_links:
                    try:
                        denominazione_elem = await link.query_selector('h4')
                        denominazione = (await denominazione_elem.inner_text()).strip() if denominazione_elem else ""
                        
                        if not denominazione:  # Salta elementi vuoti
                            continue
                        
                        regione_elem = await link.query_selector('p.regione')
                        regione = (await regione_elem.inner_text()).strip() if regione_elem else ""
                        
                        comune_elem = await link.query_selector('p.comune')
                        comune = (await comune_elem.inner_text()).strip() if comune_elem else ""
                        
                        provincia_elem = await link.query_selector('p.provincia')
                        provincia = (await provincia_elem.inner_text()).strip() if provincia_elem else ""
                        
                        affiliazione_elem = await link.query_selector('p.affiliazione span')
                        affiliazione = (await affiliazione_elem.inner_text()).strip() if affiliazione_elem else ""
                        
                        # Determina organismo
                        organismo = ""
                        for org in ORGANISMI_TARGET:
                            if org in affiliazione:
                                organismo = org
                                break
                        
                        # Se non è un organismo target, prendi il primo
                        if not organismo and affiliazione:
                            organismo = affiliazione.split()[0] if affiliazione.split() else ""
                        
                        sport = SPORT_MAP.get(organismo, organismo)
                        
                        risultati.append({
                            'denominazione': denominazione,
                            'regione': regione,
                            'provincia': provincia,
                            'comune': comune,
                            'organismo': organismo,
                            'sport': sport,
                            'affiliazione_completa': affiliazione
                        })
                        nuove_societa += 1
                        
                    except Exception as e:
                        continue
                
                # Calcola tempo stimato
                elapsed = (datetime.now() - start_time).total_seconds()
                pagine_fatte = pagina - pagina_iniziale
                if pagine_fatte > 0:
                    sec_per_pagina = elapsed / pagine_fatte
                    pagine_rimanenti = 1544 - pagina
                    minuti_rimanenti = (pagine_rimanenti * sec_per_pagina) / 60
                else:
                    minuti_rimanenti = 0
                
                # Log ogni 10 pagine
                if pagina % 10 == 0:
                    logger.info(f"📄 Pagina {pagina}/1544 | +{nuove_societa} società | Tot: {len(risultati)} | ETA: {minuti_rimanenti:.0f} min")
                
                # Checkpoint ogni N pagine
                if pagina % SALVA_OGNI_N_PAGINE == 0:
                    salva_checkpoint(pagina, risultati)
                
                # Se meno di 30 risultati, potrebbe essere l'ultima pagina
                if count < RISULTATI_PER_PAGINA:
                    logger.info(f"📄 Pagina {pagina}: {count} risultati (< 30), potrebbe essere l'ultima")
                
        except Exception as e:
            logger.error(f"❌ Errore critico: {e}")
            salva_checkpoint(pagina, risultati)
            raise
        
        finally:
            await browser.close()
    
    # Salva risultati finali
    risultati_finali = salva_risultati_finali(risultati)
    
    # Rimuovi checkpoint
    checkpoint_file = Path('output/checkpoint.json')
    if checkpoint_file.exists():
        os.remove(checkpoint_file)
        logger.info("🗑️ Checkpoint rimosso (scraping completato)")
    
    return risultati_finali


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("SCRAPING REGISTRO CONI - TUTTE LE SOCIETÀ ITALIANE")
    logger.info("=" * 60)
    
    start = datetime.now()
    risultati = asyncio.run(scrape_tutte_le_pagine())
    end = datetime.now()
    
    durata = (end - start).total_seconds() / 60
    logger.info(f"\n✅ COMPLETATO in {durata:.1f} minuti")
    logger.info(f"✅ Società target estratte: {len(risultati)}")
