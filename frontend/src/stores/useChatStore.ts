import { chatService } from '@/services/chatService'
import type { ChatState } from '@/types/store'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        })
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true })
          const { conversations } = await chatService.fetchConversations()

          set({ conversations, convoLoading: false })
        } catch (error) {
          console.error(error)
          set({ convoLoading: false })
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get()
        const { user } = useAuthStore.getState()
        const convoId = conversationId ?? activeConversationId

        if (!convoId) return

        const current = messages?.[convoId]
        const nextCursor =
          current?.nextCursor === undefined ? '' : current?.nextCursor
        if (nextCursor === null) return
        set({ messageLoading: true })
        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          )
          const processed = fetched.map((msg) => ({
            ...msg,
            isOwn: msg.senderId === user?._id,
          }))
          set((state) => {
            const prev = state.messages[convoId]?.items ?? []
            const merged = prev.length > 0 ? [...processed, ...prev] : processed
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            }
          })
        } catch (error) {
          console.error(error)
        } finally {
          set({ messageLoading: false })
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        const { activeConversationId } = get()
        const message = await chatService.sendDirectMessage(
          recipientId,
          content,
          imgUrl,
          activeConversationId ?? undefined
        )
        set((state) => ({
            messages: {
              ...state.messages,
              [message.conversationId]: {
                items: [...(state.messages[message.conversationId]?.items ?? []), { ...message, isOwn: true }],
                hasMore: state.messages[message.conversationId]?.hasMore ?? false,
                nextCursor: state.messages[message.conversationId]?.nextCursor ?? null,
              },
            },
            conversations: state.conversations.map((c) =>
              c._id === message.conversationId
                ? {
                    ...c,
                    seenBy: [],
                    lastMessageAt: message.createdAt,
                    lastMessage: {
                      _id: message._id,
                      content: message.content ?? '',
                      createdAt: message.createdAt,
                      sender: useAuthStore.getState().user!,
                    },
                  }
                : c
            ),
        }))
      },
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        const message = await chatService.sendGroupMessage(conversationId, content, imgUrl)
        set((state) => ({
            messages: {
              ...state.messages,
              [message.conversationId]: {
                items: [...(state.messages[message.conversationId]?.items ?? []), { ...message, isOwn: true }],
                hasMore: state.messages[message.conversationId]?.hasMore ?? false,
                nextCursor: state.messages[message.conversationId]?.nextCursor ?? null,
              },
            },
            conversations: state.conversations.map((c) =>
              c._id === message.conversationId
                ? {
                    ...c,
                    seenBy: [],
                    lastMessageAt: message.createdAt,
                    lastMessage: {
                      _id: message._id,
                      content: message.content ?? '',
                      createdAt: message.createdAt,
                      sender: useAuthStore.getState().user!,
                    },
                  }
                : c
            ),
        }))
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
)
