import api from '@/lib/axios'
import type { ConversationResponse, Message } from '@/types/chat'

interface FetchMessageProps {
  messages: Message[]
  cursor?: string
}

interface SendMessageResponse {
  message: string
  data: Message
}

const pageLimit = 50

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get('/conversations')
    return res.data
  },
  async fetchMessages(
    conversationId: string,
    cursor?: string | null
  ): Promise<FetchMessageProps> {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params: {
        limit: pageLimit,
        ...(cursor ? { cursor } : {}),
      },
    })
    return {
      messages: res.data.messages,
      cursor: res.data.nextCursor,
    }
  },
  async markConversationRead(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}/read`)
  },
  async sendDirectMessage(
    recipientId: string,
    content: string = '',
    imgUrl?: string,
    conversationId?: string
  ): Promise<Message> {
    const res = await api.post<SendMessageResponse>('/messages/direct', {
      recipientId,
      content,
      imgUrl,
      conversationId,
    })
    return res.data.data
  },
  async sendGroupMessage(
    conversationId: string,
    content: string = '',
    imgUrl?: string
  ): Promise<Message> {
    const res = await api.post<SendMessageResponse>('/messages/group', {
      conversationId,
      content,
      imgUrl,
    })
    return res.data.data
  },
}
