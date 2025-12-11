/**
 * Notification Dispatcher
 * 
 * Sistema centralizzato per la gestione delle connessioni SSE (Server-Sent Events)
 * e il dispatch real-time delle notifiche agli utenti connessi.
 * 
 * Architettura:
 * - Mantiene un registro di client connessi per userId
 * - Quando viene creata una notifica, la invia in real-time a tutti i client dell'utente
 * - Gestisce automaticamente la rimozione dei client disconnessi
 */

import { Notification } from './types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rappresenta un client SSE connesso
 */
export interface SSEClient {
    id: string
    userId: string
    controller: ReadableStreamDefaultController<Uint8Array>
    createdAt: Date
}

/**
 * Evento SSE da inviare
 */
export interface SSEEvent {
    event: string
    data: any
}

// ============================================================================
// CLIENT REGISTRY
// ============================================================================

// Mappa userId -> Set di client connessi
const clientsByUser = new Map<string, Set<SSEClient>>()

// Contatore globale per ID univoci
let clientIdCounter = 0

/**
 * Genera un ID univoco per un client
 */
function generateClientId(): string {
    return `client_${Date.now()}_${++clientIdCounter}`
}

/**
 * Formatta un messaggio SSE secondo lo standard
 */
function formatSSEMessage(event: SSEEvent): string {
    const lines: string[] = []

    if (event.event) {
        lines.push(`event: ${event.event}`)
    }

    const dataStr = typeof event.data === 'string'
        ? event.data
        : JSON.stringify(event.data)

    lines.push(`data: ${dataStr}`)
    lines.push('') // Linea vuota per terminare il messaggio
    lines.push('')

    return lines.join('\n')
}

/**
 * Invia un messaggio SSE a un singolo client
 */
function sendToClient(client: SSEClient, event: SSEEvent): boolean {
    try {
        const message = formatSSEMessage(event)
        const encoder = new TextEncoder()
        client.controller.enqueue(encoder.encode(message))
        return true
    } catch (error) {
        console.error(`Failed to send to client ${client.id}:`, error)
        // Client probabilmente disconnesso, lo rimuoviamo
        removeClient(client.userId, client.id)
        return false
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Registra un nuovo client SSE per un utente
 * 
 * @param userId - ID dell'utente
 * @param controller - Controller dello stream SSE
 * @returns Client registrato
 */
export function addClient(
    userId: string,
    controller: ReadableStreamDefaultController<Uint8Array>
): SSEClient {
    const client: SSEClient = {
        id: generateClientId(),
        userId: String(userId),
        controller,
        createdAt: new Date()
    }

    if (!clientsByUser.has(client.userId)) {
        clientsByUser.set(client.userId, new Set())
    }

    clientsByUser.get(client.userId)!.add(client)

    console.log(`[SSE] Client ${client.id} connected for user ${client.userId}. Total clients for user: ${clientsByUser.get(client.userId)!.size}`)

    return client
}

/**
 * Rimuove un client SSE
 * 
 * @param userId - ID dell'utente
 * @param clientId - ID del client da rimuovere
 */
export function removeClient(userId: string, clientId: string): boolean {
    const userClients = clientsByUser.get(String(userId))

    if (!userClients) {
        return false
    }

    let removed = false
    for (const client of userClients) {
        if (client.id === clientId) {
            userClients.delete(client)
            removed = true
            break
        }
    }

    // Pulisci la mappa se l'utente non ha più client
    if (userClients.size === 0) {
        clientsByUser.delete(String(userId))
    }

    if (removed) {
        console.log(`[SSE] Client ${clientId} disconnected for user ${userId}`)
    }

    return removed
}

/**
 * Rimuove un client usando l'oggetto client
 */
export function removeClientByRef(client: SSEClient): boolean {
    return removeClient(client.userId, client.id)
}

/**
 * Invia una notifica a tutti i client di un utente
 * 
 * @param userId - ID dell'utente destinatario
 * @param notification - Oggetto notifica da inviare
 * @returns Numero di client che hanno ricevuto la notifica
 */
export function dispatchToUser(userId: string | number, notification: Notification): number {
    const userClients = clientsByUser.get(String(userId))

    if (!userClients || userClients.size === 0) {
        console.log(`[SSE] No clients connected for user ${userId}`)
        return 0
    }

    const event: SSEEvent = {
        event: 'notification',
        data: notification
    }

    let successCount = 0
    for (const client of userClients) {
        if (sendToClient(client, event)) {
            successCount++
        }
    }

    console.log(`[SSE] Dispatched notification to ${successCount}/${userClients.size} clients for user ${userId}`)

    return successCount
}

/**
 * Invia un evento di conteggio non lette aggiornato
 */
export function dispatchUnreadCount(userId: string | number, count: number): number {
    const userClients = clientsByUser.get(String(userId))

    if (!userClients || userClients.size === 0) {
        return 0
    }

    const event: SSEEvent = {
        event: 'unread_count',
        data: { count }
    }

    let successCount = 0
    for (const client of userClients) {
        if (sendToClient(client, event)) {
            successCount++
        }
    }

    return successCount
}

/**
 * Invia un heartbeat a tutti i client di un utente (keep-alive)
 */
export function sendHeartbeat(userId: string): number {
    const userClients = clientsByUser.get(String(userId))

    if (!userClients || userClients.size === 0) {
        return 0
    }

    const event: SSEEvent = {
        event: 'heartbeat',
        data: { timestamp: new Date().toISOString() }
    }

    let successCount = 0
    for (const client of userClients) {
        if (sendToClient(client, event)) {
            successCount++
        }
    }

    return successCount
}

/**
 * Invia un heartbeat a TUTTI i client connessi (per keep-alive globale)
 */
export function broadcastHeartbeat(): number {
    let totalSent = 0

    for (const [userId] of clientsByUser) {
        totalSent += sendHeartbeat(userId)
    }

    return totalSent
}

/**
 * Ottiene statistiche sulle connessioni attive
 */
export function getConnectionStats(): {
    totalClients: number
    totalUsers: number
    clientsByUser: Record<string, number>
} {
    const stats: Record<string, number> = {}
    let totalClients = 0

    for (const [userId, clients] of clientsByUser) {
        stats[userId] = clients.size
        totalClients += clients.size
    }

    return {
        totalClients,
        totalUsers: clientsByUser.size,
        clientsByUser: stats
    }
}

/**
 * Pulisce tutti i client (utile per shutdown o testing)
 */
export function clearAllClients(): void {
    clientsByUser.clear()
    console.log('[SSE] All clients cleared')
}
