import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHistoryLimit,
  openNotificationStream,
} from './notification.api'
import { NotificationContext, type NotificationContextValue } from './notification.context'
import type { NotificationConnection, NotificationItem, NotificationListener } from './notification.types'

function mergeItems(previous: NotificationItem[], incoming: NotificationItem[]) {
  const items = new Map(previous.map((item) => [item.id, item]))
  for (const item of incoming) {
    items.set(item.id, { ...item, readAt: item.readAt ?? items.get(item.id)?.readAt ?? null })
  }
  return [...items.values()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, notificationHistoryLimit)
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { status, currentUserId } = useAuth()
  if (status !== 'authenticated' || !currentUserId) return <>{children}</>
  return <NotificationSession key={currentUserId}>{children}</NotificationSession>
}

function NotificationSession({ children }: PropsWithChildren) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [historyStatus, setHistoryStatus] = useState<NotificationContextValue['historyStatus']>('loading')
  const [connection, setConnection] = useState<NotificationConnection>('connecting')
  const sessionRef = useRef<AbortController | null>(null)
  const historyRequest = useRef<AbortController | null>(null)
  const countRequest = useRef<AbortController | null>(null)
  const listeners = useRef(new Set<NotificationListener>())

  const subscribe = useCallback((listener: NotificationListener) => {
    const subscribers = listeners.current
    subscribers.add(listener)
    return () => { subscribers.delete(listener) }
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    const session = sessionRef.current
    if (!session || session.signal.aborted) return
    countRequest.current?.abort()
    const request = new AbortController()
    countRequest.current = request
    const signal = AbortSignal.any([session.signal, request.signal])
    try {
      const count = await getUnreadCount(signal)
      if (!signal.aborted) setUnreadCount(count)
    } catch {
      // Keep the last confirmed count until a refresh succeeds.
    }
  }, [])

  const refreshHistory = useCallback(async () => {
    const session = sessionRef.current
    if (!session || session.signal.aborted) return
    historyRequest.current?.abort()
    const request = new AbortController()
    historyRequest.current = request
    const signal = AbortSignal.any([session.signal, request.signal])
    try {
      const history = await getNotifications(signal)
      if (signal.aborted) return
      setItems((previous) => mergeItems(previous, history))
      setHistoryStatus('ready')
    } catch {
      if (!signal.aborted) setHistoryStatus('error')
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([refreshHistory(), refreshUnreadCount()])
  }, [refreshHistory, refreshUnreadCount])

  const markRead = useCallback(async (ids: readonly string[]) => {
    const signal = sessionRef.current?.signal
    if (!signal || signal.aborted) return
    const results = await Promise.allSettled(ids.map((id) => markNotificationRead(id, signal)))
    if (signal.aborted) return
    await refresh()
    if (results.some((result) => result.status === 'rejected')) {
      throw new Error('Could not update all selected notifications.')
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    const signal = sessionRef.current?.signal
    if (!signal || signal.aborted) return
    await markAllNotificationsRead(signal)
    if (!signal.aborted) await refresh()
  }, [refresh])

  useEffect(() => {
    const session = new AbortController()
    sessionRef.current = session
    // Defer startup so React's development cleanup can cancel the first mount.
    queueMicrotask(() => {
      if (session.signal.aborted) return
      void refresh()
      void openNotificationStream({
        signal: session.signal,
        onConnected() {
          if (session.signal.aborted) return
          setConnection('connected')
          void refresh()
          listeners.current.forEach((listener) => listener({ type: 'connected' }))
        },
        onNotification(item) {
          if (session.signal.aborted) return
          setItems((previous) => mergeItems(previous, [item]))
          void refreshUnreadCount()
          listeners.current.forEach((listener) => listener({ type: 'notification', item }))
        },
        onReconnect() {
          if (!session.signal.aborted) setConnection('reconnecting')
        },
      }).catch(() => {
        if (!session.signal.aborted) setConnection('unavailable')
      })
    })
    return () => {
      session.abort()
      sessionRef.current = null
    }
  }, [refresh, refreshUnreadCount])

  const value = useMemo<NotificationContextValue>(
    () => ({ items, unreadCount, historyStatus, connection, refresh, markRead, markAllRead, subscribe }),
    [items, unreadCount, historyStatus, connection, refresh, markRead, markAllRead, subscribe],
  )
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
