'use client'

import { useEffect, useState } from 'react'
import { Bell, Trash2, Check } from 'lucide-react'
import { Notification } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)

  const userId = user?.id ? Number(user.id) : null

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId)
    }
  }, [filter, userId])

  const fetchNotifications = async (userId: number) => {
    setLoading(true)
    try {
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : ''
      const res = await fetch(`/api/notifications?userId=${userId}${unreadParam}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) return

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true, userId: parseInt(userId) }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'affiliation_request':
        return 'bg-blue-100 text-blue-800'
      case 'affiliation_accepted':
        return 'bg-green-100 text-green-800'
      case 'application_received':
        return 'bg-purple-100 text-purple-800'
      case 'application_status_update':
        return 'bg-yellow-100 text-yellow-800'
      case 'club_invitation':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={28} />
          <h1 className="text-2xl font-bold">Notifiche</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Check size={16} />
            Segna tutte come lette
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Tutte
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Non lette
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Caricamento...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessuna notifica da visualizzare</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`border rounded-lg p-4 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(
                        notif.type
                      )}`}
                    >
                      {notif.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(typeof notif.id === 'number' ? notif.id : parseInt(notif.id))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Segna come letta"
                    >
                      <Check size={18} className="text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(typeof notif.id === 'number' ? notif.id : parseInt(notif.id))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
