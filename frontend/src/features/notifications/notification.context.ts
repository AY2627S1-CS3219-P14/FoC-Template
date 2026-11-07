import { createContext } from 'react'
import type { NotificationConnection, NotificationItem, NotificationListener } from './notification.types'

export type NotificationContextValue = {
  items: NotificationItem[]
  unreadCount: number | null
  historyStatus: 'loading' | 'ready' | 'error'
  connection: NotificationConnection
  refresh: () => Promise<void>
  markRead: (ids: readonly string[]) => Promise<void>
  markAllRead: () => Promise<void>
  subscribe: (listener: NotificationListener) => () => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
