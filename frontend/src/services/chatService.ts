import api from '@/lib/axios'
import type { ConversationResponse, MessagesResponse } from '@/types/chat'

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get('/conversations')
    return res.data
  },
  async fetchMessages(
    conversationId: string,
    cursor?: string | null
  ): Promise<MessagesResponse> {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params: { cursor: cursor ?? undefined },
    })
    return res.data
  },
}
