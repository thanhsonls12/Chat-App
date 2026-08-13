import type { Socket } from 'socket.io-client'
import type { Conversation, Message } from './chat'
import type { Friend, FriendRequest, User } from './user'

export interface AuthState {
  accessToken: string | null
  user: User | null
  loading: boolean

  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>

  signIn: (username: string, password: string) => Promise<void>

  signOut: () => Promise<void>

  clearState: () => void

  fetchMe: () => Promise<void>

  refresh: () => Promise<void>

  setAccessToken: (accessToken: string) => void
}

export interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

export interface ChatState {
  conversations: Conversation[]
  messages: Record<
    string,
    {
      items: Message[]
      hasMore: boolean
      nextCursor?: string | null
    }
  >
  activeConversationId: string | null
  convoLoading: boolean
  reset: () => void
  setActiveConversation: (id: string | null) => void
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId?: string) => Promise<void>
  markConversationRead: (conversationId: string) => Promise<void>
  markConversationSeen: (
    conversationId: string,
    userId: string,
    messageId: string
  ) => void
  messageLoading: boolean
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string
  ) => Promise<void>
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string
  ) => Promise<void>
  addMessage: (message: Message) => void
  updateConversation: (conversation: Conversation) => void
  addConvo: (convo: Conversation) => void
  createConversation: (
    type: 'direct' | 'group',
    name: string,
    memberIds: string[]
  ) => Promise<void>
}

export interface SocketState {
  socket: Socket | null
  onlineUsers: string[]
  connectSocket: () => void
  disconnectSocket: () => void
}

export interface FriendState {
  friends: Friend[]
  loading: boolean
  searchByUsername: (username: string) => Promise<User | null>
  addFriend: (to: string, message?: string) => Promise<string>
  receivedList: FriendRequest[]
  sentList: FriendRequest[]
  getAllFriendRequests: () => Promise<void>
  acceptRequest: (requestId: string) => Promise<void>
  declineRequest: (requestId: string) => Promise<void>
  getFriends: () => Promise<void>
}
