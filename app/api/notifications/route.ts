/**
 * API Route: /api/notifications
 * 
 * Gestisce le operazioni CRUD sulle notifiche usando il repository centralizzato.
 * Integra il dispatcher SSE per notifiche real-time.
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import {
    getUserNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllUserNotifications,
    isNotificationTypeEnabled,
    getUnreadCount
} from '@/lib/notifications-repository'
import { dispatchToUser, dispatchUnreadCount } from '@/lib/notification-dispatcher'

// ============================================================================
// GET /api/notifications
// ============================================================================
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const notifications = getUserNotifications({
        userId,
        unreadOnly,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    return NextResponse.json(notifications)
}

// ============================================================================
// POST /api/notifications - Crea notifica
// ============================================================================
export async function POST(request: Request) {
    const body = await request.json()
    const { userId, type, title, message, metadata } = body

    if (!userId || !type || !title || !message) {
        return NextResponse.json(
            { error: 'userId, type, title, and message required' },
            { status: 400 }
        )
    }

    // Verifica preferenze utente
    if (!isNotificationTypeEnabled(String(userId), type)) {
        return NextResponse.json({
            skipped: true,
            reason: 'notification_disabled_by_user',
            message: 'User has disabled notifications for this category'
        }, { status: 200 })
    }

    // Crea la notifica
    const newNotification = createNotification({
        userId,
        type,
        title,
        message,
        metadata
    })

    // Dispatch real-time via SSE
    dispatchToUser(userId, newNotification)
    dispatchUnreadCount(userId, getUnreadCount(userId))

    return NextResponse.json(newNotification, { status: 201 })
}

// ============================================================================
// PUT /api/notifications - Segna come letta/non letta
// ============================================================================
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, read, markAllAsRead: markAll, userId } = body

    // Segna tutte come lette
    if (markAll && userId) {
        const count = markAllAsRead(String(userId))

        // Aggiorna contatore SSE
        dispatchUnreadCount(userId, 0)

        return NextResponse.json({ success: true, markedCount: count })
    }

    // Segna singola notifica
    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const notification = markAsRead(id, read)

    if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Aggiorna contatore SSE
    if (notification.userId) {
        dispatchUnreadCount(notification.userId, getUnreadCount(notification.userId))
    }

    return NextResponse.json(notification)
}

// ============================================================================
// DELETE /api/notifications - Elimina notifica
// ============================================================================
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    // Elimina tutte per utente
    if (deleteAll && userId) {
        const count = deleteAllUserNotifications(String(userId))

        // Aggiorna contatore SSE
        dispatchUnreadCount(userId, 0)

        return NextResponse.json({ success: true, deletedCount: count })
    }

    // Elimina singola
    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const deleted = deleteNotification(id)

    if (!deleted) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
