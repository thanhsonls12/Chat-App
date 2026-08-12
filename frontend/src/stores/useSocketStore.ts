import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from './useAuthStore'
import type { SocketState } from '@/types/store'
import { useChatStore } from './useChatStore'
import type {
  NewMessageSocketPayload,
  ReadMessageSocketPayload,
} from '@/types/chat'

const baseUrl = import.meta.env.VITE_SOCKET_URL

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken
    const existingSocket = get().socket
    if (existingSocket) return

    const socket: Socket = io(baseUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
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

    socket.on('connect_error', (error) => {
      console.error('socket connection failed', error.message)
    })
  },
  disconnectSocket: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, onlineUsers: [] })
    }
  },
}))
