export interface Participant {
  _id: string
  displayName: string
  avatarUrl?: string
  joinedAt: string
}

export interface SeenUser {
  _id: string
  displayName: string
  avatarUrl?: string
}

export interface Group {
  name: string
  createdBy: string
}

export interface LastMessage {
  _id: string
  content: string
  createdAt: string
  sender: SeenUser
}

export interface Conversation {
  _id: string
  type: 'direct' | 'group'
  group: Group
  participants: Participant[]
  lastMessageAt: string
  seenBy: SeenUser[]
  lastMessage: LastMessage | null
  unreadCounts: Record<string, number> // key = userId, value = unread count
  createdAt: string
  updatedAt: string
}

export interface ConversationResponse {
  conversations: Conversation[]
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string | null
  imgUrl?: string | null
  updatedAt?: string | null
  createdAt: string
  isOwn?: boolean
}

export interface NewMessageSocketPayload {
  message: Omit<Message, 'content'> & {
    content?: string | null
  }
  conversation: {
    _id: string
    lastMessageAt: string
    lastMessage: {
      _id: string
      senderId: string
      content?: string | null
      imgUrl?: string | null
      createdAt: string
    }
  }
  unreadCounts: Record<string, number>
}

export interface ReadMessageSocketPayload {
  conversationId: string
  userId: string
  messageId: string
}
