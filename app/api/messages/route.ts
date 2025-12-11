import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Percorso file JSON
const MESSAGES_PATH = path.join(process.cwd(), 'data', 'messages.json')

function ensureFile() {
    if (!fs.existsSync(MESSAGES_PATH)) {
        fs.mkdirSync(path.dirname(MESSAGES_PATH), { recursive: true })
        fs.writeFileSync(MESSAGES_PATH, '[]')
    }
}

function readMessages() {
    ensureFile()
    const raw = fs.readFileSync(MESSAGES_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeMessages(messages: any[]) {
    ensureFile()
    fs.writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2))
}

// Helpers
function normalizeId(id: any) { return String(id) }

// GET /api/messages
// Modalità 1: ?userId=U&peerId=P -> ritorna thread conversazione (ordinato per timestamp asc)
// Modalità 2: ?userId=U -> ritorna elenco conversazioni (ultimo messaggio + conteggio non letti)
export async function GET(req: Request) {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const peerId = url.searchParams.get('peerId')

    const messages = readMessages()

    if (userId && peerId) {
        const u = normalizeId(userId)
        const p = normalizeId(peerId)
        const thread = messages.filter((m: any) => (
            (m.senderId === u && m.receiverId === p) ||
            (m.senderId === p && m.receiverId === u)
        ))
        thread.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        return NextResponse.json(thread)
    }

    if (userId) {
        const u = normalizeId(userId)
        // Raggruppa per interlocutore
        const convoMap: Record<string, { peerId: string, lastMessage: any, unread: number }> = {}
        messages.forEach((m: any) => {
            if (m.senderId === u || m.receiverId === u) {
                const peer = m.senderId === u ? m.receiverId : m.senderId
                if (!convoMap[peer]) {
                    convoMap[peer] = { peerId: peer, lastMessage: m, unread: 0 }
                }
                // Aggiorna ultimo messaggio se più recente
                const currentLast = convoMap[peer].lastMessage
                if (new Date(m.timestamp).getTime() > new Date(currentLast.timestamp).getTime()) {
                    convoMap[peer].lastMessage = m
                }
                // Conta non letti (messaggi ricevuti da peer -> userId e read=false)
                if (m.receiverId === u && !m.read) {
                    convoMap[peer].unread += 1
                }
            }
        })
        const conversations = Object.values(convoMap)
        conversations.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())
        return NextResponse.json(conversations)
    }

    // Se nessun parametro, ritorna tutti i messaggi (debug)
    return NextResponse.json(messages)
}

// POST /api/messages
// Body: { senderId, receiverId, text, sharedPostId? }
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const senderId = normalizeId(body.senderId)
        const receiverId = normalizeId(body.receiverId)
        const text = (body.text || '').toString().trim()
        const sharedPostId = body.sharedPostId ? Number(body.sharedPostId) : undefined

        if (!senderId || !receiverId || !text) {
            return NextResponse.json({ error: 'senderId, receiverId, text required' }, { status: 400 })
        }

        const messages = readMessages()
        const newMessage: any = {
            id: Date.now(),
            senderId,
            receiverId,
            text,
            timestamp: new Date().toISOString(),
            read: false
        }

        // Add sharedPostId if provided
        if (sharedPostId !== undefined) {
            newMessage.sharedPostId = sharedPostId
        }

        messages.push(newMessage)
        writeMessages(messages)

        // ========== CREA NOTIFICA PER IL DESTINATARIO ==========
        try {
            // Carica i dati degli utenti per ottenere il nome del mittente
            const usersPath = path.join(process.cwd(), 'data', 'users.json')
            const usersData = fs.readFileSync(usersPath, 'utf8')
            const users = JSON.parse(usersData)
            const sender = users.find((u: any) => normalizeId(u.id) === senderId)
            const senderName = sender
                ? `${sender.firstName} ${sender.lastName}`
                : 'Un utente'

            // Crea notifica message_received
            await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: receiverId,
                    type: 'message_received',
                    title: 'Nuovo messaggio ricevuto',
                    message: `${senderName} ti ha inviato un nuovo messaggio`,
                    metadata: {
                        fromUserId: senderId,
                        fromUserName: senderName,
                        conversationId: senderId, // Usa senderId come conversationId
                        messageId: newMessage.id
                    }
                })
            })
        } catch (notifError) {
            // Se la notifica fallisce, non bloccare la creazione del messaggio
            console.error('Failed to create message notification:', notifError)
        }

        return NextResponse.json(newMessage, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}

// PATCH /api/messages
// Body: { userId, peerId } -> segna tutti i messaggi ricevuti da peer come letti
// oppure { ids: [ ... ] } -> segna specifici messaggi
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const messages = readMessages()

        const ids: number[] = Array.isArray(body.ids) ? body.ids : []
        const userId = body.userId ? normalizeId(body.userId) : null
        const peerId = body.peerId ? normalizeId(body.peerId) : null

        let updatedCount = 0

        if (ids.length > 0) {
            ids.forEach(id => {
                const msg = messages.find((m: any) => Number(m.id) === Number(id))
                if (msg && !msg.read) {
                    msg.read = true
                    updatedCount++
                }
            })
        } else if (userId && peerId) {
            messages.forEach((m: any) => {
                if (m.senderId === peerId && m.receiverId === userId && !m.read) {
                    m.read = true
                    updatedCount++
                }
            })
        } else {
            return NextResponse.json({ error: 'provide ids[] or userId+peerId' }, { status: 400 })
        }

        writeMessages(messages)
        return NextResponse.json({ updated: updatedCount })
    } catch (err) {
        return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
}
