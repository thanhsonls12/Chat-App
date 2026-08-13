import { userService } from '@/services/userService'
import type { UserState } from '@/types/store'
import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'
import { toast } from 'sonner'
import axios from 'axios'

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
      toast.success('Cập nhật thông tin thành công')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật thông tin'))
      throw error
    } finally {
      set({ updatingProfile: false })
    }
  },
  changePassword: async (input) => {
    try {
      set({ changingPassword: true })
      await userService.changePassword(input)
      toast.success('Đổi mật khẩu thành công')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể đổi mật khẩu'))
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
      toast.success('Cập nhật ảnh đại diện thành công')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Lỗi khi tải ảnh đại diện'))
    } finally {
      set({ uploadingAvatar: false })
    }
  },
}))
