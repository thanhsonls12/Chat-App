import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES, USER_MESSAGES } from '@/constants/messages.js'
import { uploadImageFromBuffer } from '@/middlewares/uploadMiddleware.js'
import User from '@/models/User.js'
import type { EmptyRequest, TypedRequest, TypedResponse } from '@/types/api.types.js'
import type { SearchUserQuery } from '@/types/friend.types.js'
import type { ChangePasswordBody, UpdateProfileBody } from '@/types/user.types.js'
import { AppError } from '@/utils/AppError.js'
import { v2 as cloudinary } from 'cloudinary'
import bcrypt from 'bcrypt'
import Session from '@/models/Session.js'

export const authMe = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const user = req.user.toObject()
  delete user.avatarId

  return res.status(HTTP_STATUS.OK).json({ user })
}

export const updateProfile = async (
  req: TypedRequest<UpdateProfileBody>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { displayName, bio, phone } = req.body
  const $set: Record<string, string> = {}
  const $unset: Record<string, 1> = {}

  if (displayName !== undefined) $set.displayName = displayName
  if (bio !== undefined) {
    if (bio) $set.bio = bio
    else $unset.bio = 1
  }
  if (phone !== undefined) {
    if (phone) $set.phone = phone
    else $unset.phone = 1
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...(Object.keys($set).length ? { $set } : {}),
      ...(Object.keys($unset).length ? { $unset } : {})
    },
    { new: true, runValidators: true }
  ).select('-hashedPassword -avatarId')

  if (!updatedUser) {
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.PROFILE_UPDATED,
    user: updatedUser
  })
}

export const changePassword = async (
  req: TypedRequest<ChangePasswordBody>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+hashedPassword')

  if (!user) {
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const passwordCorrect = await bcrypt.compare(currentPassword, user.hashedPassword)
  if (!passwordCorrect) {
    throw new AppError(USER_MESSAGES.CURRENT_PASSWORD_INCORRECT, HTTP_STATUS.BAD_REQUEST)
  }

  const passwordUnchanged = await bcrypt.compare(newPassword, user.hashedPassword)
  if (passwordUnchanged) {
    throw new AppError(USER_MESSAGES.NEW_PASSWORD_MUST_BE_DIFFERENT, HTTP_STATUS.BAD_REQUEST)
  }

  user.hashedPassword = await bcrypt.hash(newPassword, 10)
  await user.save()

  const currentRefreshToken: unknown = req.cookies?.refreshToken
  await Session.deleteMany({
    userId: user._id,
    ...(typeof currentRefreshToken === 'string'
      ? { refreshToken: { $ne: currentRefreshToken } }
      : {})
  })

  return res.status(HTTP_STATUS.OK).json({ message: USER_MESSAGES.PASSWORD_UPDATED })
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

export const uploadAvatar = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const file = req.file
  const userId = req.user._id
  if (!file) {
    throw new AppError(USER_MESSAGES.AVATAR_NOT_UPLOADED, HTTP_STATUS.BAD_REQUEST)
  }
  const previousAvatarId = req.user.avatarId
  const result = await uploadImageFromBuffer(file.buffer)
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      avatarUrl: result.secure_url,
      avatarId: result.public_id
    },
    {
      new: true
    }
  ).select('avatarUrl')

  if (!updatedUser) {
    await cloudinary.uploader.destroy(result.public_id)
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  if (previousAvatarId && previousAvatarId !== result.public_id) {
    void cloudinary.uploader.destroy(previousAvatarId).catch((error) => {
      console.error('Unable to delete previous avatar', error)
    })
  }
  return res.status(HTTP_STATUS.OK).json({ user: updatedUser })
}
