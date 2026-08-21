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
    image?: File,
    conversationId?: string
  ): Promise<Message> {
    const formData = new FormData()
    formData.append('recipientId', recipientId)
    formData.append('content', content)
    if (conversationId) formData.append('conversationId', conversationId)
    if (image) formData.append('image', image)
    const res = await api.post<SendMessageResponse>('/messages/direct', formData)
    return res.data.data
  },
  async sendGroupMessage(
    conversationId: string,
    content: string = '',
    image?: File
  ): Promise<Message> {
    const formData = new FormData()
    formData.append('conversationId', conversationId)
    formData.append('content', content)
    if (image) formData.append('image', image)
    const res = await api.post<SendMessageResponse>('/messages/group', formData)
    return res.data.data
  },

  async editMessage(messageId: string, content: string): Promise<Message> {
    const res = await api.patch<SendMessageResponse>(`/messages/${messageId}`, {
      content,
    })
    return res.data.data
  },
  async deleteMessage(messageId: string): Promise<Message> {
    const res = await api.delete<SendMessageResponse>(`/messages/${messageId}`)
    return res.data.data
  },

  async createConversation(
    type: 'direct' | 'group',
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post('/conversations', { type, name, memberIds })
    return res.data.conversation
  },

  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversations/${conversationId}/members`, {
      memberIds,
    })
    return res.data.conversation
  },

  async removeGroupMember(conversationId: string, memberId: string) {
    const res = await api.delete(
      `/conversations/${conversationId}/members/${memberId}`
    )
    return res.data.conversation
  },

  async leaveGroup(conversationId: string): Promise<void> {
    await api.post(`/conversations/${conversationId}/leave`)
  },

  async updateGroup(conversationId: string, name: string) {
    const res = await api.patch(`/conversations/${conversationId}`, { name })
    return res.data.conversation
  },
}
