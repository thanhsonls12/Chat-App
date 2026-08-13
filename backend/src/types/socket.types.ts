import type { Server, Socket } from 'socket.io'
import type { UserDocument } from '@/models/User.js'

export interface MessagePayload {
  _id: string
  conversationId: string
  senderId: string
  content?: string | null
  imgUrl?: string | null
  createdAt: string
}

export interface ConversationMessagePayload {
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

export interface NewMessagePayload {
  message: MessagePayload
  conversation: ConversationMessagePayload
  unreadCounts: Record<string, number>
}

export interface ReadMessagePayload {
  conversationId: string
  userId: string
  messageId: string
}

export interface ServerToClientEvents {
  'new-group': (conversation: unknown) => void
  'new-message': (payload: NewMessagePayload) => void
  'read-message': (payload: ReadMessagePayload) => void
  onlineUsers: (userIds: string[]) => void
}

export interface ClientToServerEvents {
  'join-conversation': (conversationId: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

export interface SocketData {
  user: UserDocument
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type SocketNext = (err?: Error) => void
