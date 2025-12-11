'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Notification } from '@/lib/types'
import { getNotificationDestination, getNotificationDotColor, isMessageNotification, filterSystemNotifications } from '@/lib/notification-utils'

interface NotificationBellProps {
  userId: number
}

// Configurazione SSE
const SSE_RECONNECT_DELAY = 3000
const POLLING_INTERVAL = 30000

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'fallback'>('connecting')

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch iniziale notifiche (esclude messaggi)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
      if (res.ok) {
        const data = await res.json()
        // Filtra le notifiche messaggi - vanno mostrate solo nell'area chat
        const systemNotifications = filterSystemNotifications(data)
        setNotifications(systemNotifications)
        setUnreadCount(systemNotifications.length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [userId])

  // Connessione SSE
  const connectSSE = useCallback(() => {
    // Cleanup precedente connessione
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const es = new EventSource(`/api/notifications/stream?userId=${userId}`)
      eventSourceRef.current = es

      es.addEventListener('connected', () => {
        console.log('[SSE] Connected')
        setConnectionStatus('connected')
        // Cancella polling fallback se attivo
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      })

      es.addEventListener('unread_count', (e) => {
        const data = JSON.parse(e.data)
        const newCount = data.count
        // Pulse animation se aumenta
        if (newCount > unreadCount) {
          setHasNewNotification(true)
          setTimeout(() => setHasNewNotification(false), 2000)
        }
        setUnreadCount(newCount)
      })

      es.addEventListener('notification', (e) => {
        const notification = JSON.parse(e.data)
        // Ignora le notifiche messaggi - vanno mostrate solo nell'area chat
        if (isMessageNotification(notification)) {
          return
        }
        setNotifications(prev => [notification, ...prev].slice(0, 10))
        setHasNewNotification(true)
        setTimeout(() => setHasNewNotification(false), 2000)
      })

      es.addEventListener('heartbeat', () => {
        // Connessione ancora attiva
      })

      es.onerror = () => {
        console.log('[SSE] Connection error, reconnecting...')
        es.close()
        eventSourceRef.current = null
        setConnectionStatus('connecting')

        // Tentativo riconnessione
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE()
        }, SSE_RECONNECT_DELAY)

        // Fallback a polling
        if (!pollingIntervalRef.current) {
          setConnectionStatus('fallback')
          pollingIntervalRef.current = setInterval(fetchNotifications, POLLING_INTERVAL)
        }
      }
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error)
      setConnectionStatus('fallback')
      // Fallback a polling
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchNotifications, POLLING_INTERVAL)
      }
    }
  }, [userId, fetchNotifications, unreadCount])

  // Inizializzazione: fetch + connessione SSE
  useEffect(() => {
    fetchNotifications()
    connectSSE()

    return () => {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [fetchNotifications, connectSSE])

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
        className={`relative p-2 hover:bg-white/10 rounded-full transition-colors text-white ${hasNewNotification ? 'animate-pulse' : ''}`}
        title={connectionStatus === 'connected' ? 'Real-time' : connectionStatus === 'fallback' ? 'Polling' : 'Connecting...'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold ${hasNewNotification ? 'animate-bounce' : ''}`}>
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
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotificationDotColor(notif.type)}`} />
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
