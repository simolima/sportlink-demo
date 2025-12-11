/**
 * Notification Utilities - Sistema centralizzato per gestione notifiche
 * 
 * Questo file contiene tutte le utility per:
 * - Determinare la destinazione quando si clicca una notifica
 * - Assegnare colori ai badge delle notifiche
 * - Raggruppare notifiche simili (Fase 2)
 * - Gestire categorie e preferenze (Fase 2)
 * - Evitare duplicazione di logica tra notification-bell e notifications/page
 */

import { Notification, NotificationType } from './types'

// ============================================================================
// CATEGORIE NOTIFICHE
// ============================================================================

/**
 * Categorie di notifiche per le preferenze utente
 */
export const NOTIFICATION_CATEGORIES = {
    follower: ['new_follower'],
    messages: ['message_received'],
    applications: ['new_application', 'candidacy_accepted', 'candidacy_rejected', 'application_received', 'application_status_changed'],
    affiliations: ['affiliation_request', 'affiliation_accepted', 'affiliation_rejected', 'affiliation_removed'],
    club: ['club_join_request', 'club_join_accepted', 'club_join_rejected'],
    opportunities: ['new_opportunity'],
    permissions: ['permission_granted', 'permission_revoked']
} as const

export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES

/**
 * Traduzione delle categorie per l'UI
 */
export const CATEGORY_TRANSLATIONS: Record<NotificationCategory, string> = {
    follower: 'Nuovi follower',
    messages: 'Messaggi',
    applications: 'Candidature',
    affiliations: 'Affiliazioni',
    club: 'Richieste club',
    opportunities: 'Opportunità',
    permissions: 'Permessi'
}

/**
 * Descrizioni delle categorie per l'UI
 */
export const CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
    follower: 'Notifiche quando qualcuno inizia a seguirti',
    messages: 'Notifiche per nuovi messaggi ricevuti',
    applications: 'Notifiche sulle candidature (inviate e ricevute)',
    affiliations: 'Notifiche sulle affiliazioni agente-giocatore',
    club: 'Notifiche sulle richieste di ingresso nei club',
    opportunities: 'Notifiche su nuove opportunità disponibili',
    permissions: 'Notifiche sui permessi concessi o revocati'
}

/**
 * Determina la categoria di un tipo di notifica
 */
export function getNotificationCategory(type: NotificationType | string): NotificationCategory | null {
    for (const [category, types] of Object.entries(NOTIFICATION_CATEGORIES)) {
        if ((types as readonly string[]).includes(type)) {
            return category as NotificationCategory
        }
    }
    return null
}

/**
 * Verifica se una notifica è di tipo messaggio.
 * 
 * Le notifiche messaggi vengono gestite separatamente nell'area chat/messaggi
 * e NON devono comparire nel centro notifiche (campanella + pagina /notifications).
 * 
 * Questa funzione serve per:
 * - Escludere i messaggi dal conteggio badge campanella
 * - Escludere i messaggi dalla lista nella pagina /notifications
 * - Mantenere la possibilità di usare message_received per push/email in futuro
 */
export function isMessageNotification(notification: Notification): boolean {
    return (
        notification.type === 'message_received' ||
        getNotificationCategory(notification.type) === 'messages'
    )
}

/**
 * Filtra le notifiche escludendo quelle di tipo messaggio.
 * Utile per il centro notifiche che deve mostrare solo eventi di sistema.
 */
export function filterSystemNotifications(notifications: Notification[]): Notification[] {
    return notifications.filter(n => !isMessageNotification(n))
}

// ============================================================================
// RAGGRUPPAMENTO NOTIFICHE
// ============================================================================

/**
 * Struttura di un gruppo di notifiche
 */
export interface GroupedNotification {
    id: string // ID unico del gruppo
    type: 'group'
    notificationType: NotificationType | string
    notifications: Notification[]
    title: string
    message: string
    count: number
    hasUnread: boolean
    destination: string | null
    hasSameDestination: boolean
    createdAt: string // Data più recente nel gruppo
    groupKey: string // Chiave di raggruppamento
}

/**
 * Tipo union per rendering (singola o gruppo)
 */
export type NotificationOrGroup = Notification | GroupedNotification

/**
 * Verifica se un item è un gruppo
 */
export function isGroupedNotification(item: NotificationOrGroup): item is GroupedNotification {
    return 'type' in item && item.type === 'group'
}

// Configurazione raggruppamento
const GROUP_TIME_WINDOW_HOURS = 24 // Finestra temporale per raggruppamento (ore)
const MESSAGE_GROUP_TIME_WINDOW_MINUTES = 30 // Finestra per messaggi (minuti)

/**
 * Genera una chiave di raggruppamento per una notifica
 */
function getGroupKey(notif: Notification): string {
    const type = notif.type
    const metadata = notif.metadata || {}

    switch (type) {
        case 'new_follower':
            // Raggruppa tutti i nuovi follower insieme
            return `new_follower`

        case 'new_application':
            // Raggruppa per opportunità (se presente)
            if (metadata.opportunityId) {
                return `new_application_${metadata.opportunityId}`
            }
            return `new_application`

        case 'message_received':
            // Raggruppa per mittente/conversazione
            const senderId = metadata.fromUserId || metadata.conversationId
            if (senderId) {
                return `message_received_${senderId}`
            }
            return `message_received`

        default:
            // Per altri tipi, non raggruppare
            return `${type}_${notif.id}`
    }
}

/**
 * Verifica se una notifica è nella finestra temporale per il raggruppamento
 */
function isWithinGroupWindow(notifDate: Date, referenceDate: Date, type: string): boolean {
    const diffMs = referenceDate.getTime() - notifDate.getTime()
    const diffMinutes = diffMs / (1000 * 60)

    if (type === 'message_received') {
        return diffMinutes <= MESSAGE_GROUP_TIME_WINDOW_MINUTES
    }

    const diffHours = diffMinutes / 60
    return diffHours <= GROUP_TIME_WINDOW_HOURS
}

/**
 * Genera titolo e messaggio per un gruppo
 */
function generateGroupContent(notifications: Notification[], type: string): { title: string; message: string } {
    const count = notifications.length
    const metadata = notifications[0]?.metadata || {}

    switch (type) {
        case 'new_follower': {
            const names = notifications
                .map(n => n.metadata?.fromUserName || n.metadata?.followerName)
                .filter(Boolean)
                .slice(0, 3)

            if (count === 1) {
                return {
                    title: 'Nuovo follower',
                    message: `${names[0] || 'Un utente'} ha iniziato a seguirti`
                }
            }

            const namesPreview = names.length > 0
                ? names.join(', ') + (count > 3 ? ` e altri ${count - 3}` : '')
                : `${count} utenti`

            return {
                title: `${count} nuovi follower`,
                message: `${namesPreview} hanno iniziato a seguirti`
            }
        }

        case 'new_application': {
            const opportunityTitle = metadata.opportunityTitle || metadata.announcementTitle || 'un\'opportunità'
            const applicantNames = notifications
                .map(n => n.metadata?.applicantName || n.metadata?.fromUserName)
                .filter(Boolean)
                .slice(0, 3)

            if (count === 1) {
                return {
                    title: 'Nuova candidatura',
                    message: `${applicantNames[0] || 'Un candidato'} si è candidato per "${opportunityTitle}"`
                }
            }

            return {
                title: `${count} nuove candidature`,
                message: `Hai ricevuto ${count} candidature per "${opportunityTitle}"`
            }
        }

        case 'message_received': {
            const senderName = metadata.fromUserName || 'Un utente'

            if (count === 1) {
                return {
                    title: 'Nuovo messaggio',
                    message: `${senderName} ti ha inviato un messaggio`
                }
            }

            return {
                title: `${count} nuovi messaggi`,
                message: `Hai ${count} nuovi messaggi da ${senderName}`
            }
        }

        default:
            return {
                title: notifications[0]?.title || 'Notifica',
                message: notifications[0]?.message || ''
            }
    }
}

/**
 * Raggruppa le notifiche simili per una migliore UX
 * 
 * @param notifications - Array di notifiche da raggruppare
 * @returns Array misto di notifiche singole e gruppi
 */
export function groupNotifications(notifications: Notification[]): NotificationOrGroup[] {
    if (!notifications || notifications.length === 0) {
        return []
    }

    // Ordina per data (più recenti prima)
    const sorted = [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Mappa per raggruppamento: groupKey -> notifiche
    const groupMap = new Map<string, Notification[]>()

    // Tipi raggruppabili
    const groupableTypes = ['new_follower', 'new_application', 'message_received']

    for (const notif of sorted) {
        if (!groupableTypes.includes(notif.type)) {
            // Notifica non raggruppabile - usa ID unico
            groupMap.set(`single_${notif.id}`, [notif])
            continue
        }

        const groupKey = getGroupKey(notif)

        if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, [])
        }

        const existingGroup = groupMap.get(groupKey)!

        // Verifica finestra temporale rispetto alla prima notifica del gruppo
        if (existingGroup.length > 0) {
            const referenceDate = new Date(existingGroup[0].createdAt)
            const notifDate = new Date(notif.createdAt)

            if (!isWithinGroupWindow(notifDate, referenceDate, notif.type)) {
                // Fuori dalla finestra - crea nuovo gruppo
                const newKey = `${groupKey}_${notif.id}`
                groupMap.set(newKey, [notif])
                continue
            }
        }

        existingGroup.push(notif)
    }

    // Converti mappa in array risultato
    const result: NotificationOrGroup[] = []

    for (const [groupKey, notifs] of groupMap) {
        if (notifs.length === 1) {
            // Notifica singola
            result.push(notifs[0])
        } else {
            // Gruppo
            const type = notifs[0].type
            const { title, message } = generateGroupContent(notifs, type)

            // Calcola destinazione comune
            const destinations = notifs.map(n => getNotificationDestination(n.type, n.metadata))
            const uniqueDestinations = [...new Set(destinations.filter(Boolean))]
            const hasSameDestination = uniqueDestinations.length === 1

            const group: GroupedNotification = {
                id: `group_${groupKey}`,
                type: 'group',
                notificationType: type,
                notifications: notifs,
                title,
                message,
                count: notifs.length,
                hasUnread: notifs.some(n => !n.read),
                destination: hasSameDestination ? uniqueDestinations[0]! : null,
                hasSameDestination,
                createdAt: notifs[0].createdAt, // La più recente (già ordinato)
                groupKey
            }

            result.push(group)
        }
    }

    // Ordina risultato per data
    result.sort((a, b) => {
        const dateA = isGroupedNotification(a) ? a.createdAt : a.createdAt
        const dateB = isGroupedNotification(b) ? b.createdAt : b.createdAt
        return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

    return result
}

// ============================================================================
// PREFERENZE NOTIFICHE
// ============================================================================

/**
 * Struttura delle preferenze notifiche utente
 */
export interface NotificationPreferences {
    userId: string
    preferences: Record<NotificationCategory, boolean>
}

/**
 * Preferenze di default (tutte abilitate)
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Record<NotificationCategory, boolean> = {
    follower: true,
    messages: true,
    applications: true,
    affiliations: true,
    club: true,
    opportunities: true,
    permissions: true
}

/**
 * Verifica se una notifica di un certo tipo è abilitata per l'utente
 */
export function isNotificationEnabled(
    type: NotificationType | string,
    preferences: Record<NotificationCategory, boolean>
): boolean {
    const category = getNotificationCategory(type)
    if (!category) {
        // Tipo sconosciuto - abilita di default
        return true
    }
    return preferences[category] ?? true
}

/**
 * Determina l'URL di destinazione quando l'utente clicca su una notifica
 * 
 * @param type - Tipo della notifica (es. 'new_follower', 'message_received')
 * @param metadata - Dati aggiuntivi della notifica (es. fromUserId, conversationId)
 * @returns URL di destinazione o null se non c'è una destinazione specifica
 */
export function getNotificationDestination(type: NotificationType | string, metadata?: any): string | null {
    switch (type) {
        // ========== AFFILIAZIONI ==========
        // Player riceve richiesta affiliazione -> pagina affiliazioni player
        case 'affiliation_request':
            return '/player/affiliations'

        // Agent riceve accettazione/rifiuto -> pagina affiliazioni agent
        case 'affiliation_accepted':
        case 'affiliation_rejected':
            return '/agent/affiliations'

        // Affiliazione rimossa - verifica chi ha ricevuto la notifica dai metadata
        case 'affiliation_removed':
            if (metadata?.playerId) {
                // L'agente ha ricevuto la notifica
                return '/agent/affiliations'
            } else if (metadata?.agentId) {
                // Il player ha ricevuto la notifica - nessuna destinazione specifica
                return null
            }
            return null

        // ========== CLUB ==========
        // Richieste di ingresso al club
        case 'club_join_request':
        case 'club_join_accepted':
        case 'club_join_rejected':
            return '/clubs'

        // ========== SOCIAL ==========
        // Nuovo follower -> vai al profilo del follower
        case 'new_follower':
            if (metadata?.fromUserId || metadata?.followerId) {
                const followerId = metadata.fromUserId || metadata.followerId
                return `/profile/${followerId}`
            }
            return null

        // ========== MESSAGGI ==========
        // Nuovo messaggio ricevuto -> apri conversazione
        case 'message_received':
            if (metadata?.conversationId) {
                return `/messages/${metadata.conversationId}`
            }
            if (metadata?.fromUserId) {
                // Fallback: usa l'ID del mittente come conversationId
                return `/messages/${metadata.fromUserId}`
            }
            return '/messages'

        // ========== CANDIDATURE / OPPORTUNITÀ ==========
        // Sporting Director riceve candidatura -> pagina gestione candidature
        case 'new_application':
        case 'application_received':
            return '/club-applications'

        // Candidato riceve esito -> pagina le mie candidature
        case 'candidacy_accepted':
        case 'candidacy_rejected':
        case 'application_status_changed':
            return '/my-applications'

        // Nuova opportunità pubblicata
        case 'new_opportunity':
            if (metadata?.opportunityId) {
                return `/opportunities/${metadata.opportunityId}`
            }
            return '/opportunities'

        // ========== PERMESSI ==========
        case 'permission_granted':
        case 'permission_revoked':
            // Vai alla pagina del club o profilo dove il permesso è stato modificato
            if (metadata?.clubId) {
                return `/clubs/${metadata.clubId}`
            }
            return null

        // ========== DEFAULT ==========
        default:
            // Nessuna destinazione specifica - rimani sulla pagina notifiche
            return null
    }
}

/**
 * Determina il colore del badge per un tipo di notifica
 * 
 * @param type - Tipo della notifica
 * @returns Classi Tailwind per bg e text del badge
 */
export function getNotificationColor(type: NotificationType | string): string {
    switch (type) {
        // ========== AFFILIAZIONI ==========
        case 'affiliation_request':
            return 'bg-purple-100 text-purple-800'
        case 'affiliation_accepted':
            return 'bg-green-100 text-green-800'
        case 'affiliation_rejected':
            return 'bg-red-100 text-red-800'
        case 'affiliation_removed':
            return 'bg-orange-100 text-orange-800'

        // ========== CLUB ==========
        case 'club_join_request':
        case 'club_join_accepted':
        case 'club_join_rejected':
            return 'bg-orange-100 text-orange-800'

        // ========== SOCIAL ==========
        case 'new_follower':
            return 'bg-blue-100 text-blue-800' // Blu coerente con brand (#2341F0)

        // ========== MESSAGGI ==========
        case 'message_received':
            return 'bg-cyan-100 text-cyan-800' // Azzurro per messaggistica

        // ========== CANDIDATURE / OPPORTUNITÀ ==========
        case 'new_application':
        case 'application_received':
            return 'bg-yellow-100 text-yellow-800'

        case 'candidacy_accepted':
        case 'application_status_changed': // Se positivo
            return 'bg-green-100 text-green-800'

        case 'candidacy_rejected':
            return 'bg-red-100 text-red-800'

        case 'new_opportunity':
            return 'bg-indigo-100 text-indigo-800'

        // ========== PERMESSI ==========
        case 'permission_granted':
            return 'bg-emerald-100 text-emerald-800'
        case 'permission_revoked':
            return 'bg-gray-100 text-gray-800'

        // ========== DEFAULT ==========
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

/**
 * Determina il colore del pallino "unread" per notifiche non lette
 * Usa colori coerenti con il tipo di notifica
 * 
 * @param type - Tipo della notifica
 * @returns Classe Tailwind per il background del pallino
 */
export function getNotificationDotColor(type: NotificationType | string): string {
    switch (type) {
        case 'new_follower':
            return 'bg-blue-500' // Blu brand #2341F0
        case 'message_received':
            return 'bg-cyan-500'
        case 'new_application':
            return 'bg-yellow-500'
        case 'candidacy_accepted':
            return 'bg-green-500'
        case 'candidacy_rejected':
            return 'bg-red-500'
        case 'affiliation_request':
        case 'affiliation_accepted':
        case 'affiliation_rejected':
            return 'bg-purple-500'
        case 'club_join_request':
        case 'club_join_accepted':
        case 'club_join_rejected':
            return 'bg-orange-500'
        default:
            return 'bg-blue-500' // Default blu
    }
}

/**
 * Formatta il tipo di notifica per la visualizzazione
 * 
 * @param type - Tipo della notifica
 * @returns Stringa formattata per display
 */
export function formatNotificationType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase()
}
