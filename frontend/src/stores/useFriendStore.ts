import { friendService } from '@/services/friendService'
import type { FriendState } from '@/types/store'
import axios from 'axios'
import { toast } from 'sonner'
import { create } from 'zustand'

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, { msg?: string }>
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return fallback

  const validationMessage = Object.values(error.response?.data?.errors ?? {}).find(
    (item) => typeof item?.msg === 'string'
  )?.msg

  return validationMessage ?? error.response?.data?.message ?? fallback
}

export const useFriendStore = create<FriendState>((set) => ({
  loading: false,
  searchByUsername: async (username) => {
    try {
      set({ loading: true })
      const user = await friendService.searchByUsername(username)
      return user
    } catch (error) {
      console.error(error)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      toast.error(getErrorMessage(error, 'Không thể tìm kiếm người dùng'))
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
  addFriend: async (to, message) => {
    try {
      set({ loading: true })
      const resultMessage = await friendService.sendFriendRequest(to, message)
      return resultMessage
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Không thể gửi lời mời kết bạn'))
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
}))
