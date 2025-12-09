'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Notification } from '@/lib/types'

interface NotificationBellProps {
  userId: number
}

// Get destination URL based on notification type and metadata
function getNotificationDestination(type: string, metadata?: any): string | null {
  switch (type) {
    // Player receives affiliation request -> go to player affiliations page
    case 'affiliation_request':
      return '/player/affiliations'
    // Agent receives acceptance/rejection -> go to agent affiliations page  
    case 'affiliation_accepted':
    case 'affiliation_rejected':
      return '/agent/affiliations'
    // Affiliation removed - check metadata to determine who received it
    case 'affiliation_removed':
      // If metadata has playerId, it means the agent received this notification
      // If metadata has agentId, it means the player received this notification
      if (metadata?.playerId) {
        return '/agent/affiliations'
      } else if (metadata?.agentId) {
        // Player received notification - just go to notifications page (no specific destination)
        return null
      }
      return null
    default:
      return null
  }
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifiche</h3>
              <Link
                href="/notifications"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setShowDropdown(false)}
              >
                Vedi tutte
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Nessuna nuova notifica
              </div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={async () => {
                      await markAsRead(typeof notif.id === 'number' ? notif.id : parseInt(notif.id))
                      setShowDropdown(false)
                      const destination = getNotificationDestination(notif.type, notif.metadata)
                      if (destination) {
                        router.push(destination)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
