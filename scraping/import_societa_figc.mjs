#!/usr/bin/env node
/**
 * Import società FIGC da CSV → Supabase public.sports_organizations
 *
 * Colonne CSV: denominazione, regione, provincia, comune, organismo, sport, affiliazione_completa
 * Colonne DB:  name, country, city, sport_id, [region, province, organism, affiliation - extra]
 *
 * Uso:
 *   node scraping/import_societa_figc.mjs
 *
 * Richiede variabili d'ambiente (o file .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Carica .env.local manualmente (no dipendenza da dotenv)
const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
try {
    const env = readFileSync(join(rootDir, '.env.local'), 'utf8')
    for (const line of env.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
} catch { /* .env.local non presente, usa variabili già settate */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CSV_PATH = join(__dirname, 'output', 'societa_FIGC_20260118_222545.csv')
const BATCH_SIZE = 500

async function main() {
    // 1. Recupera la mappa sport_name → sport_id da lookup_sports
    const { data: sports, error: sErr } = await supabase
        .from('lookup_sports')
        .select('id, name')

    if (sErr) { console.error('❌ Errore lookup_sports:', sErr.message); process.exit(1) }

    const sportMap = {}
    for (const s of sports) sportMap[s.name.toLowerCase()] = s.id
    console.log('✅ Sports caricati:', Object.keys(sportMap))

    // 2. Leggi il CSV riga per riga
    const rl = createInterface({ input: createReadStream(CSV_PATH) })
    const lines = []
    let header = true

    for await (const line of rl) {
        if (header) { header = false; continue } // salta intestazione
        lines.push(line)
    }

    console.log(`📄 Righe CSV lette: ${lines.length}`)

    // 3. Parsing e mappatura
    let skipped = 0
    const rows = []

    for (const line of lines) {
        // Split CSV semplice (le virgole nei nomi sono rare ma gestite tenendo 7 campi dal fondo)
        const parts = line.split(',')
        if (parts.length < 7) { skipped++; continue }

        // Prende gli ultimi 6 campi come fissi, il resto è il nome
        const affiliazione = parts[parts.length - 1].trim()
        const sport = parts[parts.length - 2].trim()
        const organismo = parts[parts.length - 3].trim()
        const comune = parts[parts.length - 4].trim()
        const provincia = parts[parts.length - 5].trim()
        const regione = parts[parts.length - 6].trim()
        const denominazione = parts.slice(0, parts.length - 6).join(',').trim()

        const sport_id = sportMap[sport.toLowerCase()]
        if (!sport_id) { skipped++; continue } // sport non in lookup_sports

        rows.push({
            name: denominazione,
            country: 'Italy',
            city: comune || null,
            sport_id,
            // Campi extra (opzionali — aggiungi le colonne al DB se vuoi tenerli)
            // region: regione,
            // province: provincia,
            // organism: organismo,
            // affiliation: affiliazione,
        })
    }

    console.log(`✅ Righe valide: ${rows.length} | Saltate: ${skipped}`)

    // 4. Deduplicazione in memoria (stesso name+country+city+sport_id)
    const seen = new Set()
    const unique = rows.filter(r => {
        const key = `${r.name}|${r.country}|${r.city}|${r.sport_id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
    console.log(`🔑 Righe uniche: ${unique.length}`)

    // 5. Insert a batch con upsert (ignora duplicati già presenti nel DB)
    let inserted = 0
    let errors = 0

    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE)
        const { error } = await supabase
            .from('sports_organizations')
            .upsert(batch, {
                onConflict: 'name,country,city,sport_id',
                ignoreDuplicates: true
            })

        if (error) {
            console.error(`❌ Errore batch ${i}-${i + BATCH_SIZE}:`, error.message)
            errors++
        } else {
            inserted += batch.length
            process.stdout.write(`\r⬆️  Inserite: ${inserted}/${unique.length}`)
        }
    }

    console.log(`\n\n🎉 Import completato! Inserite: ${inserted} | Errori batch: ${errors}`)
}

main().catch(e => { console.error(e); process.exit(1) })
