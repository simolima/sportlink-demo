'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, BellOff } from 'lucide-react'
import { playNotificationSound, getSoundVariant, isSoundEnabled, toggleSound, unlockAudioContext } from '@/lib/notification-sound'
import Link from 'next/link'
import { Notification } from '@/lib/types'
import { supabase } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/auth-fetch'
import { getNotificationDestination, getNotificationDotColor, isMessageNotification, filterSystemNotifications } from '@/lib/notification-utils'

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Unlock AudioContext on first user gesture so it's ready when a
  // Supabase Realtime push arrives (no gesture associated with that event).
  useEffect(() => {
    const unlock = () => unlockAudioContext()
    document.addEventListener('click', unlock, { once: true })
    return () => document.removeEventListener('click', unlock)
  }, [])

  // Sync sound state from localStorage (client only)
  useEffect(() => {
    setSoundEnabled(isSoundEnabled())
  }, [])

  const handleToggleSound = () => {
    unlockAudioContext()
    const next = toggleSound()
    setSoundEnabled(next)
  }

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

  // Supabase Realtime subscription + fetch iniziale
  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, any> }) => {
          const raw = payload.new
          const notification: Notification = {
            id: raw.id,
            userId: raw.user_id,
            type: raw.type,
            title: raw.title,
            message: raw.message,
            metadata: raw.metadata,
            read: raw.is_read,
            createdAt: raw.created_at,
          }
          if (isMessageNotification(notification)) return
          setNotifications(prev => [notification, ...prev].slice(0, 10))
          setUnreadCount(prev => prev + 1)
          setHasNewNotification(true)
          playNotificationSound(getSoundVariant(raw.type))
          setTimeout(() => setHasNewNotification(false), 2000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  // Suono campanella per messaggi in arrivo quando l'utente non è nella chat
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`msg-sound:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          // ChatPanel gestisce il suono in-chat; qui suona solo se si è altrove
          if (!pathname?.startsWith('/messages')) {
            playNotificationSound(getSoundVariant('message_received'))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, pathname])

  const markAsRead = async (id: number) => {
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id }),
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
        title="Notifiche"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSound}
                  className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500"
                  title={soundEnabled ? 'Disabilita suono' : 'Abilita suono'}
                  aria-label={soundEnabled ? 'Disabilita suono notifiche' : 'Abilita suono notifiche'}
                >
                  {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                <Link
                  href="/notifications"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowDropdown(false)}
                >
                  Vedi tutte
                </Link>
              </div>
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
