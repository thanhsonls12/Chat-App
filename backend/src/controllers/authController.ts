import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { AUTH_MESSAGES, COMMON_MESSAGES } from '@/constants/messages.js'
import User from '@/models/User.js'
import bcrypt from 'bcrypt'

import Session from '@/models/Session.js'
import { SignInBody, SignUpBody } from '@/types/auth.types.js'
import type { EmptyRequest, TypedRequest, TypedResponse } from '@/types/api.types.js'
import { generateRefreshToken, REFRESH_TOKEN_TTL_MS, signAccessToken } from '@/utils/jwt.js'
import { AppError } from '@/utils/AppError.js'
import { envConfig } from '@/config/env.js'

export const signUp = async (req: TypedRequest<SignUpBody>, res: TypedResponse) => {
  const { username, password, email, firstName, lastName } = req.body
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
  })

  if (existingUser) {
    if (existingUser.username === normalizedUsername) {
      throw new AppError(AUTH_MESSAGES.USERNAME_ALREADY_EXISTS, HTTP_STATUS.CONFLICT)
    }
    throw new AppError(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await User.create({
    username: normalizedUsername,
    hashedPassword,
    email: normalizedEmail,
    displayName: `${lastName} ${firstName}`
  })

  return res.status(HTTP_STATUS.CREATED).json({ message: AUTH_MESSAGES.USER_CREATED })
}

export const signIn = async (req: TypedRequest<SignInBody>, res: TypedResponse) => {
  const { username, password } = req.body
  const normalizedUsername = username.trim().toLowerCase()

  const user = await User.findOne({ username: normalizedUsername })
  if (!user) {
    throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED)
  }

  const passwordCorrect = await bcrypt.compare(password, user.hashedPassword)

  if (!passwordCorrect) {
    throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED)
  }

  const accessToken = signAccessToken(user._id.toString())

  const refreshToken = generateRefreshToken()

  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  })

  const isProduction = envConfig.NODE_ENV === 'production'
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_MS
  })

  return res.status(HTTP_STATUS.OK).json({
    message: AUTH_MESSAGES.SIGN_IN_SUCCESS,
    accessToken
  })
}

export const signOut = async (req: EmptyRequest, res: TypedResponse) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  await Session.findOneAndDelete({
    refreshToken: token
  })

  const isProduction = envConfig.NODE_ENV === 'production'
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  })

  return res.status(HTTP_STATUS.OK).json({ message: AUTH_MESSAGES.SIGN_OUT_SUCCESS })
}

export const refreshToken = async (req: EmptyRequest, res: TypedResponse) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const session = await Session.findOne({ refreshToken: token })

  if (!session) {
    throw new AppError(COMMON_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
  }

  if (session.expiresAt < new Date()) {
    throw new AppError(COMMON_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
  }

  const accessToken = signAccessToken(session.userId.toString())

  return res.status(HTTP_STATUS.OK).json({ accessToken })
}
