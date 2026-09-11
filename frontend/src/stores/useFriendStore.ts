import { friendService } from '@/services/friendService'
import type { FriendState } from '@/types/store'
import axios from 'axios'
import { toast } from 'sonner'
import { create } from 'zustand'
import { t } from '@/i18n'

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, { msg?: string }>
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return fallback

  const validationMessage = Object.values(
    error.response?.data?.errors ?? {}
  ).find((item) => typeof item?.msg === 'string')?.msg

  return validationMessage ?? error.response?.data?.message ?? fallback
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  loading: false,
  receivedList: [],
  sentList: [],
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
      toast.error(getErrorMessage(error, t('userSearchFailed')))
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
      toast.error(getErrorMessage(error, t('friendRequestFailed')))
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
  getAllFriendRequests: async () => {
    try {
      set({ loading: true })
      const { received, sent } = await friendService.getAllFriendRequests()
      set({
        receivedList: received,
        sentList: sent,
      })
    } catch (error) {
      console.error(error)
      toast.error(
        getErrorMessage(error, t('friendRequestsLoadFailed'))
      )
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
  acceptRequest: async (requestId) => {
    try {
      set({ loading: true })
      await friendService.acceptRequest(requestId)
      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }))
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, t('friendAcceptFailed')))
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
  declineRequest: async (requestId) => {
    try {
      set({ loading: true })
      await friendService.declineRequest(requestId)
      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }))
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, t('friendDeclineFailed')))
      throw error
    } finally {
      set({
        loading: false,
      })
    }
  },
  getFriends: async () => {
    try {
      set({ loading: true })
      const friends = await friendService.getFriendList()
      set({ friends: friends })
    } catch (error) {
      console.error(error)
      set({ friends: [] })
    } finally {
      set({
        loading: false,
      })
    }
  },
}))
