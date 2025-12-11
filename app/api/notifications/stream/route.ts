/**
 * SSE Stream Endpoint per Notifiche Real-time
 * 
 * Questo endpoint mantiene una connessione persistente con il client
 * e invia notifiche in tempo reale quando vengono create.
 * 
 * Usage:
 * const es = new EventSource('/api/notifications/stream?userId=123')
 * es.addEventListener('notification', (e) => { ... })
 * es.addEventListener('unread_count', (e) => { ... })
 * es.addEventListener('heartbeat', (e) => { ... })
 */

import { addClient, removeClientByRef, SSEClient } from '@/lib/notification-dispatcher'
import { getUnreadCount } from '@/lib/notifications-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Intervallo heartbeat (30 secondi)
const HEARTBEAT_INTERVAL = 30000

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // Variabili per gestire il client e l'intervallo
    let client: SSEClient | null = null
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null

    // Crea lo stream SSE
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // Registra il client
            client = addClient(userId, controller)

            // Encoder per i messaggi
            const encoder = new TextEncoder()

            // Invia messaggio iniziale di connessione
            const connectMessage = `event: connected\ndata: ${JSON.stringify({
                clientId: client.id,
                userId: userId,
                timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(encoder.encode(connectMessage))

            // Invia il conteggio iniziale delle non lette
            try {
                const unreadCount = getUnreadCount(userId)
                const countMessage = `event: unread_count\ndata: ${JSON.stringify({ count: unreadCount })}\n\n`
                controller.enqueue(encoder.encode(countMessage))
            } catch (error) {
                console.error('[SSE] Failed to get initial unread count:', error)
            }

            // Heartbeat per mantenere la connessione attiva
            heartbeatInterval = setInterval(() => {
                try {
                    const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
                        timestamp: new Date().toISOString()
                    })}\n\n`
                    controller.enqueue(encoder.encode(heartbeat))
                } catch (error) {
                    // Se fallisce, il client è probabilmente disconnesso
                    console.error('[SSE] Heartbeat failed, client likely disconnected')
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval)
                    }
                }
            }, HEARTBEAT_INTERVAL)
        },

        cancel() {
            // Pulizia quando il client si disconnette
            console.log(`[SSE] Stream cancelled for user ${userId}`)

            if (heartbeatInterval) {
                clearInterval(heartbeatInterval)
                heartbeatInterval = null
            }

            if (client) {
                removeClientByRef(client)
                client = null
            }
        }
    })

    // Restituisci la response SSE con gli header corretti
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disabilita buffering per nginx
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}

// OPTIONS per CORS preflight
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}
