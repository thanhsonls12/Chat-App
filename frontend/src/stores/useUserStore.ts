import { userService } from '@/services/userService'
import type { UserState } from '@/types/store'
import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'
import { toast } from 'sonner'
import axios from 'axios'
import { t } from '@/i18n'

interface ApiErrorResponse {
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message || fallback
    : fallback

export const useUserStore = create<UserState>((set) => ({
  updatingProfile: false,
  uploadingAvatar: false,
  changingPassword: false,
  updateProfile: async (input) => {
    try {
      set({ updatingProfile: true })
      const updatedUser = await userService.updateProfile(input)
      useAuthStore.getState().setUser(updatedUser)
      toast.success(t('profileUpdated'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('profileUpdateFailed')))
      throw error
    } finally {
      set({ updatingProfile: false })
    }
  },
  changePassword: async (input) => {
    try {
      set({ changingPassword: true })
      await userService.changePassword(input)
      toast.success(t('passwordChanged'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('passwordChangeFailed')))
      throw error
    } finally {
      set({ changingPassword: false })
    }
  },
  updateAvatarUrl: async (formData) => {
    try {
      set({ uploadingAvatar: true })
      const { user, setUser } = useAuthStore.getState()
      const updatedUser = await userService.uploadAvatar(formData)
      if (user) {
        setUser({
          ...user,
          avatarUrl: updatedUser.avatarUrl,
        })
      }
      toast.success(t('avatarUpdated'))
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, t('avatarUpdateFailed')))
    } finally {
      set({ uploadingAvatar: false })
    }
  },
}))
