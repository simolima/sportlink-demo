'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Trash2, Check, ExternalLink, ChevronDown, ChevronUp, Settings, Users, MessageSquare, Briefcase, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { Notification } from '@/lib/types'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import {
  getNotificationDestination,
  getNotificationColor,
  formatNotificationType,
  groupNotifications,
  isGroupedNotification,
  isMessageNotification,
  filterSystemNotifications,
  NotificationOrGroup,
  GroupedNotification
} from '@/lib/notification-utils'

// Configurazione SSE
const SSE_RECONNECT_DELAY = 3000

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useRequireAuth(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isRealtime, setIsRealtime] = useState(false)
  const [showNewBanner, setShowNewBanner] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userId = user?.id ? Number(user.id) : null

  // Fetch notifiche
  const fetchNotifications = useCallback(async (uid: number) => {
    setLoading(true)
    try {
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : ''
      const res = await fetch(`/api/notifications?userId=${uid}${unreadParam}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  // Connessione SSE
  const connectSSE = useCallback((uid: number) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const es = new EventSource(`/api/notifications/stream?userId=${uid}`)
      eventSourceRef.current = es

      es.addEventListener('connected', () => {
        console.log('[NotificationsPage] SSE connected')
        setIsRealtime(true)
      })

      es.addEventListener('notification', (e) => {
        const notification = JSON.parse(e.data)
        // Ignora le notifiche messaggi - vanno mostrate solo nell'area chat
        if (isMessageNotification(notification)) {
          return
        }
        // Se il filtro è "all" o la notifica è non letta, aggiungila
        if (filter === 'all' || !notification.read) {
          setNotifications(prev => [notification, ...prev])
          setShowNewBanner(true)
          setTimeout(() => setShowNewBanner(false), 3000)
        }
      })

      es.addEventListener('unread_count', () => {
        // Refetch per sincronizzare lo stato
        if (filter === 'unread') {
          fetchNotifications(uid)
        }
      })

      es.onerror = () => {
        console.log('[NotificationsPage] SSE error, reconnecting...')
        es.close()
        eventSourceRef.current = null
        setIsRealtime(false)

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE(uid)
        }, SSE_RECONNECT_DELAY)
      }
    } catch (error) {
      console.error('[NotificationsPage] Failed to create EventSource:', error)
      setIsRealtime(false)
    }
  }, [filter, fetchNotifications])

  // Inizializzazione e cleanup
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId)
      connectSSE(userId)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [userId, fetchNotifications, connectSSE])

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

  const markGroupAsRead = async (group: GroupedNotification) => {
    try {
      for (const notif of group.notifications) {
        if (!notif.read) {
          await markAsRead(typeof notif.id === 'number' ? notif.id : parseInt(notif.id as string))
        }
      }
    } catch (error) {
      console.error('Failed to mark group as read:', error)
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

  const handleNotificationClick = async (notif: Notification) => {
    const destination = getNotificationDestination(notif.type, notif.metadata)

    // Segna come letta prima di navigare
    if (!notif.read) {
      await markAsRead(typeof notif.id === 'number' ? notif.id : parseInt(notif.id as string))
    }

    // Naviga alla destinazione se esiste
    if (destination) {
      router.push(destination)
    }
  }

  const handleGroupClick = async (group: GroupedNotification) => {
    if (group.hasSameDestination && group.destination) {
      // Tutte le notifiche hanno la stessa destinazione - naviga direttamente
      await markGroupAsRead(group)
      router.push(group.destination)
    } else {
      // Destinazioni diverse - espandi/comprimi il gruppo
      toggleGroupExpand(group.id)
    }
  }

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  // Ottieni icona per tipo di gruppo
  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'new_follower':
        return <Users size={18} className="text-blue-600" />
      case 'message_received':
        return <MessageSquare size={18} className="text-cyan-600" />
      case 'new_application':
        return <Briefcase size={18} className="text-yellow-600" />
      default:
        return <Bell size={18} className="text-gray-600" />
    }
  }

  // Raggruppa le notifiche (escluse quelle di tipo messaggio)
  // I messaggi vanno gestiti solo nell'area chat, non nel centro notifiche
  const visibleNotifications = filterSystemNotifications(notifications)
  const groupedItems = groupNotifications(visibleNotifications)

  // Renderizza una singola notifica
  const renderSingleNotification = (notif: Notification, isNested = false) => {
    const destination = getNotificationDestination(notif.type, notif.metadata)
    const isClickable = !!destination

    return (
      <div
        key={notif.id}
        className={`border rounded-lg p-4 transition-all ${notif.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
          } ${isClickable ? 'cursor-pointer hover:shadow-md' : ''} ${isNested ? 'ml-4 border-l-4 border-l-blue-300' : ''
          }`}
        onClick={() => isClickable && handleNotificationClick(notif)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Badge tipo notifica */}
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${getNotificationColor(
                  notif.type
                )}`}
              >
                {formatNotificationType(notif.type)}
              </span>

              {/* Indicatore non letta */}
              {!notif.read && (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Non letta
                </span>
              )}

              {/* Icona link se cliccabile */}
              {isClickable && (
                <ExternalLink size={14} className="text-gray-400" />
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

          {/* Azioni */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {!notif.read && (
              <button
                onClick={() => markAsRead(typeof notif.id === 'number' ? notif.id : parseInt(notif.id as string))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Segna come letta"
              >
                <Check size={18} className="text-green-600" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(typeof notif.id === 'number' ? notif.id : parseInt(notif.id as string))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Elimina"
            >
              <Trash2 size={18} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Renderizza un gruppo di notifiche
  const renderGroup = (group: GroupedNotification) => {
    const isExpanded = expandedGroups.has(group.id)
    const canNavigate = group.hasSameDestination && group.destination

    return (
      <div key={group.id} className="space-y-2">
        {/* Header del gruppo */}
        <div
          className={`border rounded-lg p-4 transition-all ${group.hasUnread ? 'bg-blue-50 border-blue-200' : 'bg-white'
            } cursor-pointer hover:shadow-md`}
          onClick={() => handleGroupClick(group)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Icona gruppo */}
              <div className="p-2 bg-gray-100 rounded-lg">
                {getGroupIcon(group.notificationType)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* Badge tipo */}
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${getNotificationColor(
                      group.notificationType
                    )}`}
                  >
                    {formatNotificationType(group.notificationType)}
                  </span>

                  {/* Badge conteggio */}
                  <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {group.count} notifiche
                  </span>

                  {/* Indicatore non lette */}
                  {group.hasUnread && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      Non lette
                    </span>
                  )}

                  {/* Icona navigazione/espansione */}
                  {canNavigate ? (
                    <ExternalLink size={14} className="text-gray-400" />
                  ) : (
                    isExpanded ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )
                  )}
                </div>

                <h3 className="font-semibold text-gray-900">{group.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{group.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(group.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Azioni gruppo */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {group.hasUnread && (
                <button
                  onClick={() => markGroupAsRead(group)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Segna tutte come lette"
                >
                  <Check size={18} className="text-green-600" />
                </button>
              )}
              {!canNavigate && (
                <button
                  onClick={() => toggleGroupExpand(group.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isExpanded ? 'Comprimi' : 'Espandi'}
                >
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-600" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifiche espanse */}
        {isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {group.notifications.map((notif) => renderSingleNotification(notif, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Banner nuova notifica */}
      {showNewBanner && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Bell size={18} />
          Nuova notifica ricevuta!
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={28} />
          <h1 className="text-2xl font-bold">Notifiche</h1>
          {/* Indicatore connessione real-time */}
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isRealtime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            title={isRealtime ? 'Connesso in tempo reale' : 'Polling'}
          >
            {isRealtime ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isRealtime ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications/settings"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings size={16} />
            Impostazioni
          </Link>
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Check size={16} />
            Segna tutte come lette
          </button>
        </div>
      </div>

      {/* Filtri */}
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
      ) : groupedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p>
            {filter === 'unread'
              ? 'Nessuna notifica non letta'
              : 'Nessuna notifica da visualizzare'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedItems.map((item) => {
            if (isGroupedNotification(item)) {
              return renderGroup(item)
            } else {
              return renderSingleNotification(item)
            }
          })}
        </div>
      )}
    </div>
  )
}