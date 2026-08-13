import api from '@/lib/axios'
import type { User } from '@/types/user'

interface SearchUserResponse {
  user: User
}

interface SendFriendRequestResponse {
  message: string
}

export const friendService = {
  async searchByUsername(username: string): Promise<User> {
    const res = await api.get<SearchUserResponse>('/users/search', {
      params: { username: username.trim().toLowerCase() },
    })
    return res.data.user
  },

  async sendFriendRequest(to: string, message?: string): Promise<string> {
    const normalizedMessage = message?.trim()
    const res = await api.post<SendFriendRequestResponse>('/friends/requests', {
      to,
      ...(normalizedMessage ? { message: normalizedMessage } : {}),
    })
    return res.data.message
  },
}
