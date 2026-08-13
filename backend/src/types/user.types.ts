export interface UpdateProfileBody {
  displayName?: string
  bio?: string
  phone?: string
}

export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}
