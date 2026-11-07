export type NotificationItem = {
  id: string
  type: string
  errandId: string
  message: string
  createdAt: string
  readAt: string | null
}

export type NotificationConnection = 'connecting' | 'connected' | 'reconnecting' | 'unavailable'
