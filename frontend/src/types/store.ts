import type { Socket } from 'socket.io-client'
import type { Conversation, Message, TypingUser } from './chat'
import type {
  ChangePasswordInput,
  Friend,
  FriendRequest,
  UpdateProfileInput,
  User,
} from './user'

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

  setUser: (user: User) => void
}

export interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

export interface ChatState {
  loading: boolean
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
    image?: File
  ) => Promise<void>
  sendGroupMessage: (
    conversationId: string,
    content: string,
    image?: File
  ) => Promise<void>
  addMessage: (message: Message) => void
  applyMessageUpdate: (message: Message) => void
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  updateConversation: (conversation: Conversation) => void
  removeConversation: (conversationId: string) => void
  addConvo: (convo: Conversation) => void
  createConversation: (
    type: 'direct' | 'group',
    name: string,
    memberIds: string[]
  ) => Promise<void>
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>
  removeGroupMember: (conversationId: string, memberId: string) => Promise<void>
  leaveGroup: (conversationId: string) => Promise<void>
  updateGroup: (conversationId: string, name: string) => Promise<void>
}

export interface SocketState {
  socket: Socket | null
  onlineUsers: string[]
  typingUsers: Record<string, TypingUser[]>
  connectSocket: () => void
  disconnectSocket: () => void
  emitTyping: (conversationId: string, isTyping: boolean) => void
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

export interface UserState {
  updatingProfile: boolean
  uploadingAvatar: boolean
  changingPassword: boolean
  updateProfile: (input: UpdateProfileInput) => Promise<void>
  changePassword: (input: ChangePasswordInput) => Promise<void>
  updateAvatarUrl: (formData: FormData) => Promise<void>
}
