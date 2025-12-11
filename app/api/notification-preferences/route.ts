import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Percorso file JSON per le preferenze
const PREFERENCES_PATH = path.join(process.cwd(), 'data', 'notification-preferences.json')

// Categorie di default
const DEFAULT_PREFERENCES = {
    follower: true,
    messages: true,
    applications: true,
    affiliations: true,
    club: true,
    opportunities: true,
    permissions: true
}

function ensureFile() {
    if (!fs.existsSync(PREFERENCES_PATH)) {
        fs.mkdirSync(path.dirname(PREFERENCES_PATH), { recursive: true })
        fs.writeFileSync(PREFERENCES_PATH, '[]')
    }
}

function readPreferences(): Array<{ userId: string; preferences: Record<string, boolean> }> {
    ensureFile()
    try {
        const raw = fs.readFileSync(PREFERENCES_PATH, 'utf8')
        return JSON.parse(raw || '[]')
    } catch {
        return []
    }
}

function writePreferences(data: Array<{ userId: string; preferences: Record<string, boolean> }>) {
    ensureFile()
    fs.writeFileSync(PREFERENCES_PATH, JSON.stringify(data, null, 2))
}

// GET /api/notification-preferences?userId={id}
// Restituisce le preferenze notifiche dell'utente
export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const allPreferences = readPreferences()
    const userPrefs = allPreferences.find(p => p.userId === String(userId))

    if (userPrefs) {
        // Unisci con i default nel caso ci siano nuove categorie
        const mergedPreferences = {
            ...DEFAULT_PREFERENCES,
            ...userPrefs.preferences
        }
        return NextResponse.json({
            userId: String(userId),
            preferences: mergedPreferences
        })
    }

    // Restituisci i default se l'utente non ha preferenze salvate
    return NextResponse.json({
        userId: String(userId),
        preferences: DEFAULT_PREFERENCES
    })
}

// POST /api/notification-preferences
// Salva/aggiorna le preferenze notifiche dell'utente
// Body: { userId: string, preferences: Record<string, boolean> }
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, preferences } = body

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }

        if (!preferences || typeof preferences !== 'object') {
            return NextResponse.json({ error: 'preferences object required' }, { status: 400 })
        }

        const allPreferences = readPreferences()
        const existingIndex = allPreferences.findIndex(p => p.userId === String(userId))

        const userPrefs = {
            userId: String(userId),
            preferences: {
                ...DEFAULT_PREFERENCES,
                ...preferences
            }
        }

        if (existingIndex >= 0) {
            // Aggiorna esistente
            allPreferences[existingIndex] = userPrefs
        } else {
            // Crea nuovo
            allPreferences.push(userPrefs)
        }

        writePreferences(allPreferences)

        return NextResponse.json(userPrefs, { status: 200 })
    } catch (err) {
        console.error('Error saving notification preferences:', err)
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}

// OPTIONS per CORS (mobile app compatibility)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
