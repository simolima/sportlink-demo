/**
 * Notifications Repository
 * 
 * Layer di astrazione per le operazioni di storage delle notifiche.
 * Attualmente usa JSON file storage, ma è progettato per facilitare
 * la migrazione futura a Supabase o altro database.
 * 
 * Per migrare a Supabase:
 * 1. Cambiare le implementazioni interne di questo file
 * 2. Il resto dell'applicazione non richiede modifiche
 */

import fs from 'fs'
import path from 'path'
import { Notification, NotificationType } from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'data')
const NOTIFICATIONS_PATH = path.join(DATA_DIR, 'notifications.json')
const PREFERENCES_PATH = path.join(DATA_DIR, 'notification-preferences.json')

// Mappatura tipo notifica -> categoria preferenza
export const TYPE_TO_CATEGORY: Record<string, string> = {
    'new_follower': 'follower',
    'message_received': 'messages',
    'new_application': 'applications',
    'candidacy_accepted': 'applications',
    'candidacy_rejected': 'applications',
    'application_received': 'applications',
    'application_status_changed': 'applications',
    'affiliation_request': 'affiliations',
    'affiliation_accepted': 'affiliations',
    'affiliation_rejected': 'affiliations',
    'affiliation_removed': 'affiliations',
    'club_join_request': 'club',
    'club_join_accepted': 'club',
    'club_join_rejected': 'club',
    'new_opportunity': 'opportunities',
    'permission_granted': 'permissions',
    'permission_revoked': 'permissions',
    'profile_verified': 'profile',
    'added_to_favorites': 'profile'
}

// Preferenze di default
export const DEFAULT_PREFERENCES: Record<string, boolean> = {
    follower: true,
    messages: true,
    applications: true,
    affiliations: true,
    club: true,
    opportunities: true,
    permissions: true,
    profile: true
}

// ============================================================================
// FILE HELPERS (interno)
// ============================================================================

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
}

function ensureNotificationsFile() {
    ensureDataDir()
    if (!fs.existsSync(NOTIFICATIONS_PATH)) {
        fs.writeFileSync(NOTIFICATIONS_PATH, '[]')
    }
}

function ensurePreferencesFile() {
    ensureDataDir()
    if (!fs.existsSync(PREFERENCES_PATH)) {
        fs.writeFileSync(PREFERENCES_PATH, '[]')
    }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
        if (!fs.existsSync(filePath)) {
            return defaultValue
        }
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data || JSON.stringify(defaultValue))
    } catch {
        return defaultValue
    }
}

function writeJsonFile(filePath: string, data: any) {
    ensureDataDir()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// ============================================================================
// NOTIFICATIONS REPOSITORY
// ============================================================================

export interface CreateNotificationInput {
    userId: string | number
    type: NotificationType | string
    title: string
    message: string
    metadata?: Record<string, any>
}

export interface NotificationFilters {
    userId: string | number
    unreadOnly?: boolean
    type?: NotificationType | string
    limit?: number
}

/**
 * Ottiene tutte le notifiche (raw, per uso interno)
 */
export function getAllNotifications(): Notification[] {
    ensureNotificationsFile()
    return readJsonFile<Notification[]>(NOTIFICATIONS_PATH, [])
}

/**
 * Salva tutte le notifiche (raw, per uso interno)
 */
export function saveAllNotifications(notifications: Notification[]) {
    writeJsonFile(NOTIFICATIONS_PATH, notifications)
}

/**
 * Ottiene le notifiche di un utente con filtri opzionali
 */
export function getUserNotifications(filters: NotificationFilters): Notification[] {
    const { userId, unreadOnly, type, limit } = filters
    let notifications = getAllNotifications()

    // Filter by user
    notifications = notifications.filter(
        (n) => String(n.userId) === String(userId)
    )

    // Filter by unread
    if (unreadOnly) {
        notifications = notifications.filter((n) => !n.read)
    }

    // Filter by type
    if (type) {
        notifications = notifications.filter((n) => n.type === type)
    }

    // Sort by date (most recent first)
    notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Limit results
    if (limit && limit > 0) {
        notifications = notifications.slice(0, limit)
    }

    return notifications
}

/**
 * Conta le notifiche non lette di un utente.
 * 
 * IMPORTANTE: Esclude le notifiche di tipo messaggio (message_received, categoria 'messages')
 * perché i messaggi vengono gestiti solo nell'area chat e non devono contribuire
 * al badge del centro notifiche.
 */
export function getUnreadCount(userId: string | number): number {
    const unreadNotifications = getUserNotifications({ userId, unreadOnly: true })
    // Filtra le notifiche messaggi - vanno gestite solo nell'area chat
    const systemNotifications = unreadNotifications.filter(n => {
        const category = TYPE_TO_CATEGORY[n.type]
        return category !== 'messages'
    })
    return systemNotifications.length
}

/**
 * Crea una nuova notifica
 * Ritorna la notifica creata o null se skippata (preferenze utente)
 */
export function createNotification(input: CreateNotificationInput): Notification | null {
    const { userId, type, title, message, metadata } = input

    // Verifica preferenze utente
    if (!isNotificationTypeEnabled(String(userId), type)) {
        return null // Skipped
    }

    const notifications = getAllNotifications()

    const newNotification: Notification = {
        id: Date.now(),
        userId: String(userId),
        type: type as NotificationType,
        title,
        message,
        metadata: metadata || {},
        read: false,
        createdAt: new Date().toISOString()
    }

    notifications.push(newNotification)
    saveAllNotifications(notifications)

    return newNotification
}

/**
 * Segna una notifica come letta
 */
export function markAsRead(id: number | string): Notification | null {
    const notifications = getAllNotifications()
    const index = notifications.findIndex((n) => String(n.id) === String(id))

    if (index === -1) {
        return null
    }

    notifications[index].read = true
    saveAllNotifications(notifications)

    return notifications[index]
}

/**
 * Segna tutte le notifiche di un utente come lette
 */
export function markAllAsRead(userId: string | number): number {
    const notifications = getAllNotifications()
    let count = 0

    notifications.forEach((n) => {
        if (String(n.userId) === String(userId) && !n.read) {
            n.read = true
            count++
        }
    })

    saveAllNotifications(notifications)
    return count
}

/**
 * Elimina una notifica
 */
export function deleteNotification(id: number | string): boolean {
    const notifications = getAllNotifications()
    const initialLength = notifications.length
    const filtered = notifications.filter((n) => String(n.id) !== String(id))

    if (filtered.length === initialLength) {
        return false // Not found
    }

    saveAllNotifications(filtered)
    return true
}

/**
 * Elimina tutte le notifiche di un utente
 */
export function deleteAllUserNotifications(userId: string | number): number {
    const notifications = getAllNotifications()
    const initialLength = notifications.length
    const filtered = notifications.filter((n) => String(n.userId) !== String(userId))

    saveAllNotifications(filtered)
    return initialLength - filtered.length
}

// ============================================================================
// PREFERENCES REPOSITORY
// ============================================================================

export interface UserPreferences {
    userId: string
    preferences: Record<string, boolean>
}

/**
 * Ottiene tutte le preferenze (raw)
 */
export function getAllPreferences(): UserPreferences[] {
    ensurePreferencesFile()
    return readJsonFile<UserPreferences[]>(PREFERENCES_PATH, [])
}

/**
 * Salva tutte le preferenze (raw)
 */
export function saveAllPreferences(preferences: UserPreferences[]) {
    writeJsonFile(PREFERENCES_PATH, preferences)
}

/**
 * Ottiene le preferenze di un utente (con default merge)
 */
export function getUserPreferences(userId: string | number): Record<string, boolean> {
    const allPrefs = getAllPreferences()
    const userPrefs = allPrefs.find((p) => p.userId === String(userId))
    return userPrefs
        ? { ...DEFAULT_PREFERENCES, ...userPrefs.preferences }
        : { ...DEFAULT_PREFERENCES }
}

/**
 * Salva le preferenze di un utente
 */
export function saveUserPreferences(
    userId: string | number,
    preferences: Record<string, boolean>
): UserPreferences {
    const allPrefs = getAllPreferences()
    const existingIndex = allPrefs.findIndex((p) => p.userId === String(userId))

    const userPrefs: UserPreferences = {
        userId: String(userId),
        preferences: { ...DEFAULT_PREFERENCES, ...preferences }
    }

    if (existingIndex >= 0) {
        allPrefs[existingIndex] = userPrefs
    } else {
        allPrefs.push(userPrefs)
    }

    saveAllPreferences(allPrefs)
    return userPrefs
}

/**
 * Verifica se un tipo di notifica è abilitato per un utente
 */
export function isNotificationTypeEnabled(
    userId: string,
    type: NotificationType | string
): boolean {
    const category = TYPE_TO_CATEGORY[type]
    if (!category) {
        // Tipo sconosciuto - abilita di default
        return true
    }
    const prefs = getUserPreferences(userId)
    return prefs[category] ?? true
}
