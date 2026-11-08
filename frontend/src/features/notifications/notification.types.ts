type NotificationBase = {
  id: string
  message: string
  createdAt: string
  readAt: string | null
}

export type ChatNotificationItem = NotificationBase & {
  type: 'CHAT_MESSAGE'
  data: { errandId: string; conversationId: string; messageId: string }
}

export type NotificationItem = ChatNotificationItem | (NotificationBase & {
  type: string
  data: { errandId: string; conversationId?: string; messageId?: string }
})

export type NotificationConnection = 'connecting' | 'connected' | 'reconnecting' | 'unavailable'

export type NotificationSignal =
  | { type: 'connected' }
  | { type: 'notification'; item: NotificationItem }

export type NotificationListener = (signal: NotificationSignal) => void
