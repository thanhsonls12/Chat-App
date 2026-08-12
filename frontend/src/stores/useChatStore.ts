import { chatService } from '@/services/chatService'
import type { ChatState } from '@/types/store'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'

const appendUniqueMessage = <T extends { _id: string }>(
  items: T[],
  message: T
) =>
  items.some((item) => item._id === message._id) ? items : [...items, message]

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
            const existingIds = new Set(prev.map((message) => message._id))
            const merged = [
              ...processed.filter((message) => !existingIds.has(message._id)),
              ...prev,
            ]
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
              conversations: state.conversations.map((conversation) =>
                conversation._id === convoId && user
                  ? {
                      ...conversation,
                      unreadCounts: {
                        ...conversation.unreadCounts,
                        [user._id]: 0,
                      },
                    }
                  : conversation
              ),
            }
          })
        } catch (error) {
          console.error(error)
        } finally {
          set({ messageLoading: false })
        }
      },
      markConversationRead: async (conversationId) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation._id === conversationId
              ? {
                  ...conversation,
                  unreadCounts: {
                    ...conversation.unreadCounts,
                    [user._id]: 0,
                  },
                }
              : conversation
          ),
        }))

        try {
          await chatService.markConversationRead(conversationId)
        } catch (error) {
          console.error(error)
          void get().fetchConversations()
        }
      },
      markConversationSeen: (conversationId, userId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (
              conversation._id !== conversationId ||
              conversation.lastMessage?._id !== messageId
            ) {
              return conversation
            }
            const alreadySeen = conversation.seenBy.some(
              (seenUser) => seenUser._id === userId
            )
            if (alreadySeen) {
              return conversation
            }
            const participant = conversation.participants.find(
              (item) => item._id === userId
            )
            if (!participant) {
              return conversation
            }
            return {
              ...conversation,
              seenBy: [
                ...conversation.seenBy,
                {
                  _id: participant._id,
                  displayName: participant.displayName,
                  avatarUrl: participant.avatarUrl,
                },
              ],
              unreadCounts: {
                ...conversation.unreadCounts,
                [userId]: 0,
              },
            }
          }),
        }))
      },
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        const { activeConversationId } = get()
        const user = useAuthStore.getState().user
        if (!user) return

        const seenUser = {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        }

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
              items: appendUniqueMessage(
                state.messages[message.conversationId]?.items ?? [],
                { ...message, isOwn: true }
              ),
              hasMore: state.messages[message.conversationId]?.hasMore ?? false,
              nextCursor:
                state.messages[message.conversationId]?.nextCursor ?? null,
            },
          },
          conversations: state.conversations.map((c) =>
            c._id === message.conversationId
              ? {
                  ...c,
                  seenBy: [seenUser],
                  lastMessageAt: message.createdAt,
                  lastMessage: {
                    _id: message._id,
                    content: message.content ?? '',
                    createdAt: message.createdAt,
                    sender: seenUser,
                  },
                }
              : c
          ),
        }))
      },
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        const user = useAuthStore.getState().user
        if (!user) return

        const seenUser = {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        }

        const message = await chatService.sendGroupMessage(
          conversationId,
          content,
          imgUrl
        )
        set((state) => ({
          messages: {
            ...state.messages,
            [message.conversationId]: {
              items: appendUniqueMessage(
                state.messages[message.conversationId]?.items ?? [],
                { ...message, isOwn: true }
              ),
              hasMore: state.messages[message.conversationId]?.hasMore ?? false,
              nextCursor:
                state.messages[message.conversationId]?.nextCursor ?? null,
            },
          },
          conversations: state.conversations.map((c) =>
            c._id === message.conversationId
              ? {
                  ...c,
                  seenBy: [seenUser],
                  lastMessageAt: message.createdAt,
                  lastMessage: {
                    _id: message._id,
                    content: message.content ?? '',
                    createdAt: message.createdAt,
                    sender: seenUser,
                  },
                }
              : c
          ),
        }))
      },
      addMessage: (message) => {
        const { user } = useAuthStore.getState()
        const convoId = message.conversationId
        set((state) => {
          const current = state.messages[convoId]
          if (current?.items.some((item) => item._id === message._id)) {
            return state
          }
          return {
            messages: {
              ...state.messages,
              [convoId]: {
                items: [
                  ...(current?.items ?? []),
                  { ...message, isOwn: message.senderId === user?._id },
                ],
                hasMore: current?.hasMore ?? true,
                nextCursor: current?.nextCursor ?? null,
              },
            },
          }
        })
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations
            .map((item) =>
              item._id === conversation._id ? conversation : item
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime()
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
