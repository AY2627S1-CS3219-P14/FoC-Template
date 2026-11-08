export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  clientMessageId: string
  sequenceNumber: number
  content: string
  createdAt: string
}

export type Conversation = {
  id: string
  errandId: string
  requesterId: string
  courierId: string
  deliveryStatus: string
  expiresAt: string | null
  chatClosesAt: string | null
  writable: boolean
}

export type ConversationListItem = Conversation & { lastMessage: ChatMessage | null }
