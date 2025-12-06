import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json')

function readNotifications() {
    const data = fs.readFileSync(notificationsPath, 'utf-8')
    return JSON.parse(data)
}

function writeNotifications(notifications: any[]) {
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2))
}

// GET /api/notifications - Get notifications
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    let notifications = readNotifications()

    // Filter by user
    notifications = notifications.filter((n: any) => n.userId.toString() === userId)

    // Filter by unread
    if (unreadOnly) {
        notifications = notifications.filter((n: any) => !n.read)
    }

    // Sort by date (most recent first)
    notifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(notifications)
}

// POST /api/notifications - Create notification
export async function POST(request: Request) {
    const body = await request.json()
    const { userId, type, title, message, metadata } = body

    if (!userId || !type || !title || !message) {
        return NextResponse.json({ error: 'userId, type, title, and message required' }, { status: 400 })
    }

    const notifications = readNotifications()

    const newNotification = {
        id: Date.now(),
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
        read: false,
        createdAt: new Date().toISOString()
    }

    notifications.push(newNotification)
    writeNotifications(notifications)

    return NextResponse.json(newNotification, { status: 201 })
}

// PUT /api/notifications - Mark as read/unread
export async function PUT(request: Request) {
    const body = await request.json()
    const { id, read, markAllAsRead, userId } = body

    const notifications = readNotifications()

    // Mark all as read for a user
    if (markAllAsRead && userId) {
        notifications.forEach((n: any) => {
            if (n.userId.toString() === userId.toString()) {
                n.read = true
            }
        })
        writeNotifications(notifications)
        return NextResponse.json({ success: true, markedCount: notifications.length })
    }

    // Mark single notification
    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const index = notifications.findIndex((n: any) => n.id.toString() === id.toString())

    if (index === -1) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (read !== undefined) {
        notifications[index].read = read
    }

    writeNotifications(notifications)
    return NextResponse.json(notifications[index])
}

// DELETE /api/notifications - Delete notification
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    const notifications = readNotifications()

    // Delete all for user
    if (deleteAll && userId) {
        const filtered = notifications.filter((n: any) => n.userId.toString() !== userId)
        writeNotifications(filtered)
        return NextResponse.json({ success: true })
    }

    // Delete single
    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const filtered = notifications.filter((n: any) => n.id.toString() !== id)

    if (notifications.length === filtered.length) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    writeNotifications(filtered)
    return NextResponse.json({ success: true })
}
