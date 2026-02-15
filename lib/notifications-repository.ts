/**
 * Notifications Repository — Supabase Version
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Table: public.notifications (id uuid, user_id uuid, type, title, message, metadata jsonb, is_read, created_at, deleted_at)
 *
 * NOTE: This is now async because it queries Supabase.
 * The old sync functions are replaced with async equivalents.
 */

import { supabaseServer } from './supabase-server'

// Re-export type mapping for backward compat
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
// NOTIFICATIONS
// ============================================================================

export interface CreateNotificationInput {
    userId: string
    type: string
    title: string
    message: string
    metadata?: Record<string, any>
}

export interface NotificationFilters {
    userId: string
    unreadOnly?: boolean
    type?: string
    limit?: number
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(filters: NotificationFilters) {
    const { userId, unreadOnly, type, limit } = filters

    let query = supabaseServer
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (unreadOnly) {
        query = query.eq('is_read', false)
    }

    if (type) {
        query = query.eq('type', type)
    }

    if (limit && limit > 0) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('getUserNotifications error:', error)
        return []
    }

    // Map to camelCase for frontend compat
    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        metadata: n.metadata || {},
        read: n.is_read,
        createdAt: n.created_at,
    }))
}

/**
 * Count unread notifications (excluding messages)
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseServer
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .is('deleted_at', null)
        .not('type', 'eq', 'message_received')

    if (error) {
        console.error('getUnreadCount error:', error)
        return 0
    }

    return count || 0
}

/**
 * Create a notification
 */
export async function createNotification(input: CreateNotificationInput) {
    const { userId, type, title, message, metadata } = input

    const { data, error } = await supabaseServer
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            metadata: metadata || {},
            is_read: false,
        })
        .select()
        .single()

    if (error) {
        console.error('createNotification error:', error)
        return null
    }

    return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: data.is_read,
        createdAt: data.created_at,
    }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(id: string) {
    const { data, error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('markAsRead error:', error)
        return null
    }

    return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: data.is_read,
        createdAt: data.created_at,
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .is('deleted_at', null)
        .select('id')

    if (error) {
        console.error('markAllAsRead error:', error)
        return 0
    }

    return data?.length || 0
}

/**
 * Delete a single notification (soft delete)
 */
export async function deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabaseServer
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('deleteNotification error:', error)
        return false
    }

    return true
}

/**
 * Delete all notifications for a user (soft delete)
 */
export async function deleteAllUserNotifications(userId: string): Promise<number> {
    const { data, error } = await supabaseServer
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select('id')

    if (error) {
        console.error('deleteAllUserNotifications error:', error)
        return 0
    }

    return data?.length || 0
}

// ============================================================================
// PREFERENCES (stored in profiles.privacy_settings for now, or JSONB column)
// For the MVP, preferences are not stored in a separate table.
// We return defaults. Can be extended later with a notification_preferences table.
// ============================================================================

export function isNotificationTypeEnabled(userId: string, type: string): boolean {
    // For now, all types are enabled — preferences can be added later
    return true
}

export function getUserPreferences(userId: string): Record<string, boolean> {
    return { ...DEFAULT_PREFERENCES }
}
