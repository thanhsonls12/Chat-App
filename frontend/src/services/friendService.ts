import api from '@/lib/axios'
import type { FriendRequest, User } from '@/types/user'

interface SearchUserResponse {
  user: User
}

interface SendFriendRequestResponse {
  message: string
}

interface FriendRequestsResponse {
  sent: FriendRequest[]
  received: FriendRequest[]
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

  async getAllFriendRequests(): Promise<FriendRequestsResponse> {
    const res = await api.get<FriendRequestsResponse>('/friends/requests')
    return res.data
  },

  async acceptRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/accept`)
  },

  async declineRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/decline`)
  },

  async getFriendList() {
    const res = await api.get('/friends')

    return res.data.friends
  },
}
