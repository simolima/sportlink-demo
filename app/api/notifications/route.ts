/**
 * API Route: /api/notifications
 * Migrated from JSON to Supabase — 15/02/2026
 *
 * Uses notifications-repository.ts (Supabase-backed).
 * SSE dispatcher calls are kept but will only work on non-serverless runtimes.
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
import { withCors, handleOptions } from '@/lib/cors'

// SSE dispatcher — may not work on Vercel serverless, imported conditionally
let dispatchToUser: any = () => 0
let dispatchUnreadCount: any = () => 0
try {
    const dispatcher = require('@/lib/notification-dispatcher')
    dispatchToUser = dispatcher.dispatchToUser
    dispatchUnreadCount = dispatcher.dispatchUnreadCount
} catch {
    // SSE dispatcher not available (serverless)
}

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/notifications?userId=X&unreadOnly=true
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
        return withCors(NextResponse.json({ error: 'userId required' }, { status: 400 }))
    }

    const notifications = await getUserNotifications({ userId, unreadOnly })

    return withCors(NextResponse.json(notifications))
}

// POST /api/notifications — Create notification
export async function POST(request: Request) {
    const body = await request.json()
    const { userId, type, title, message, metadata } = body

    if (!userId || !type || !title || !message) {
        return withCors(NextResponse.json(
            { error: 'userId, type, title, and message required' },
            { status: 400 }
        ))
    }

    // Check user preferences
    if (!isNotificationTypeEnabled(String(userId), type)) {
        return withCors(NextResponse.json({
            skipped: true,
            reason: 'notification_disabled_by_user',
        }, { status: 200 }))
    }

    const newNotification = await createNotification({
        userId: String(userId),
        type,
        title,
        message,
        metadata,
    })

    if (!newNotification) {
        return withCors(NextResponse.json({ error: 'failed_to_create' }, { status: 500 }))
    }

    // Dispatch real-time via SSE (best-effort)
    try {
        dispatchToUser(userId, newNotification)
        const count = await getUnreadCount(String(userId))
        dispatchUnreadCount(userId, count)
    } catch { /* SSE not available */ }

    return withCors(NextResponse.json(newNotification, { status: 201 }))
}

// PUT /api/notifications — Mark as read
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, markAllAsRead: markAll, userId } = body

    // Mark all as read
    if (markAll && userId) {
        const count = await markAllAsRead(String(userId))

        try { dispatchUnreadCount(userId, 0) } catch { /* SSE */ }

        return withCors(NextResponse.json({ success: true, markedCount: count }))
    }

    // Mark single notification as read
    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const notification = await markAsRead(id)

    if (!notification) {
        return withCors(NextResponse.json({ error: 'Notification not found' }, { status: 404 }))
    }

    // Update SSE badge
    try {
        if (notification.userId) {
            const count = await getUnreadCount(String(notification.userId))
            dispatchUnreadCount(notification.userId, count)
        }
    } catch { /* SSE */ }

    return withCors(NextResponse.json(notification))
}

// DELETE /api/notifications
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    // Delete all for user
    if (deleteAll && userId) {
        const count = await deleteAllUserNotifications(String(userId))

        try { dispatchUnreadCount(userId, 0) } catch { /* SSE */ }

        return withCors(NextResponse.json({ success: true, deletedCount: count }))
    }

    // Delete single
    if (!id) {
        return withCors(NextResponse.json({ error: 'id required' }, { status: 400 }))
    }

    const deleted = await deleteNotification(id)

    if (!deleted) {
        return withCors(NextResponse.json({ error: 'Notification not found' }, { status: 404 }))
    }

    return withCors(NextResponse.json({ success: true }))
}
