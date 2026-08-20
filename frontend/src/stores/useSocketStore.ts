import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from './useAuthStore'
import type { SocketState } from '@/types/store'
import { useChatStore } from './useChatStore'
import type {
  Conversation,
  MessageUpdatedSocketPayload,
  NewMessageSocketPayload,
  ReadMessageSocketPayload,
  TypingSocketPayload,
} from '@/types/chat'

const baseUrl = import.meta.env.VITE_SOCKET_URL

const TYPING_EXPIRY_MS = 5000

const typingExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  typingUsers: {},
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return

    const existingSocket = get().socket
    if (existingSocket) {
      if (existingSocket.connected) return
      existingSocket.disconnect()
      set({ socket: null, onlineUsers: [] })
    }

    const socket: Socket = io(baseUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: true,
    })
    set({ socket })

    socket.on('connect', () => {
      console.log('socket connected')
    })

    socket.on('onlineUsers', (userIds: string[]) => {
      set({ onlineUsers: userIds })
    })

    socket.on('new-message', (payload: NewMessageSocketPayload) => {
      const { message, conversation, unreadCounts } = payload
      const chatStore = useChatStore.getState()
      const currentConversation = chatStore.conversations.find(
        (item) => item._id === conversation._id
      )

      chatStore.addMessage({
        ...message,
        content: message.content ?? null,
      })

      if (!currentConversation) {
        void chatStore.fetchConversations()
        return
      }

      const sender = currentConversation.participants.find(
        (participant) => participant._id === message.senderId
      )

      chatStore.updateConversation({
        ...currentConversation,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: {
          _id: conversation.lastMessage._id,
          content: conversation.lastMessage.content ?? '',
          imgUrl: conversation.lastMessage.imgUrl ?? null,
          createdAt: conversation.lastMessage.createdAt,
          sender: {
            _id: message.senderId,
            displayName: sender?.displayName ?? '',
            avatarUrl: sender?.avatarUrl,
          },
        },
        unreadCounts,
        seenBy: sender
          ? [
              {
                _id: sender._id,
                displayName: sender.displayName,
                avatarUrl: sender.avatarUrl,
              },
            ]
          : [],
      })

      if (chatStore.activeConversationId === conversation._id) {
        void useChatStore.getState().markConversationRead(conversation._id)
      }
    })

    socket.on(
      'read-message',
      ({ conversationId, userId, messageId }: ReadMessageSocketPayload) => {
        useChatStore
          .getState()
          .markConversationSeen(conversationId, userId, messageId)
      }
    )

    socket.on('message-updated', (payload: MessageUpdatedSocketPayload) => {
      useChatStore.getState().applyMessageUpdate({
        ...payload,
        content: payload.content ?? null,
      })
    })

    socket.on(
      'user-typing',
      ({ conversationId, userId, displayName, isTyping }: TypingSocketPayload) => {
        const timerKey = `${conversationId}:${userId}`
        const existingTimer = typingExpiryTimers.get(timerKey)
        if (existingTimer) clearTimeout(existingTimer)

        const removeTyping = () => {
          typingExpiryTimers.delete(timerKey)
          set((state) => {
            const current = state.typingUsers[conversationId] ?? []
            const next = current.filter((u) => u.userId !== userId)
            return {
              typingUsers: { ...state.typingUsers, [conversationId]: next },
            }
          })
        }

        if (!isTyping) {
          removeTyping()
          return
        }

        set((state) => {
          const current = state.typingUsers[conversationId] ?? []
          if (current.some((u) => u.userId === userId)) return state
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...current, { userId, displayName }],
            },
          }
        })
        typingExpiryTimers.set(timerKey, setTimeout(removeTyping, TYPING_EXPIRY_MS))
      }
    )

    socket.on('connect_error', (error) => {
      console.error('socket connection failed', error.message)
    })

    socket.on('new-group', (conversation: Conversation) => {
      useChatStore.getState().addConvo(conversation)
      socket.emit('join-conversation', conversation._id)
    })
  },
  disconnectSocket: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      typingExpiryTimers.forEach((timer) => clearTimeout(timer))
      typingExpiryTimers.clear()
      set({ socket: null, onlineUsers: [], typingUsers: {} })
    }
  },
  emitTyping: (conversationId, isTyping) => {
    get().socket?.emit(isTyping ? 'typing' : 'stop-typing', conversationId)
  },
}))
