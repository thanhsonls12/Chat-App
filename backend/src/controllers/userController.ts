import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES, USER_MESSAGES } from '@/constants/messages.js'
import User from '@/models/User.js'
import type { EmptyRequest, TypedRequest, TypedResponse } from '@/types/api.types.js'
import type { SearchUserQuery } from '@/types/friend.types.js'
import { AppError } from '@/utils/AppError.js'

export const authMe = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  return res.status(HTTP_STATUS.OK).json({
    user: req.user
  })
}

export const searchUserByUsername = async (
  req: TypedRequest<unknown, Record<string, never>, SearchUserQuery>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const username = req.query.username.trim().toLowerCase()
  const user = await User.findOne({
    username,
    _id: { $ne: req.user._id }
  })
    .select('_id displayName username avatarUrl')
    .lean()

  if (!user) {
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  return res.status(HTTP_STATUS.OK).json({ user })
}
