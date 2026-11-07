import { createContext } from 'react'
import type { NotificationConnection, NotificationItem } from './notification.types'

export type NotificationContextValue = {
  items: NotificationItem[]
  unreadCount: number | null
  historyStatus: 'loading' | 'ready' | 'error'
  connection: NotificationConnection
  refresh: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
