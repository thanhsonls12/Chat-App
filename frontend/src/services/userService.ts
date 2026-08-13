import api from '@/lib/axios'
import type {
  ChangePasswordInput,
  UpdateProfileInput,
  User,
} from '@/types/user'

interface UploadAvatarResponse {
  user: Pick<User, '_id' | 'avatarUrl'>
}

interface UpdateProfileResponse {
  message: string
  user: User
}

export const userService = {
  updateProfile: async (input: UpdateProfileInput) => {
    const res = await api.patch<UpdateProfileResponse>('/users/me', input)
    return res.data.user
  },
  changePassword: async (input: ChangePasswordInput) => {
    await api.patch('/users/me/password', input)
  },
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post<UploadAvatarResponse>(
      '/users/uploadAvatar',
      formData
    )
    return res.data.user
  },
}
