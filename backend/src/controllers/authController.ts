import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { AUTH_MESSAGES, COMMON_MESSAGES } from '@/constants/messages.js'
import User from '@/models/User.js'
import bcrypt from 'bcrypt'
import { Request, Response } from 'express'

import Session from '@/models/Session.js'
import { SignInBody, SignUpBody } from '@/types/auth.types.js'
import { ParamsDictionary } from 'express-serve-static-core'
import { generateRefreshToken, REFRESH_TOKEN_TTL_MS, signAccessToken } from '@/utils/jwt.js'
import { AppError } from '@/utils/AppError.js'

export const signUp = async (
  req: Request<ParamsDictionary, unknown, SignUpBody>,
  res: Response
) => {
  const { username, password, email, firstName, lastName } = req.body

  const hashedPassword = await bcrypt.hash(password, 10)

  await User.create({
    username,
    hashedPassword,
    email,
    displayName: `${firstName} ${lastName}`
  })

  return res.status(HTTP_STATUS.CREATED).json({ message: AUTH_MESSAGES.USER_CREATED })
}

export const signIn = async (
  req: Request<ParamsDictionary, unknown, SignInBody>,
  res: Response
) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
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

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_TTL_MS
  })

  return res.status(HTTP_STATUS.OK).json({
    message: AUTH_MESSAGES.SIGN_IN_SUCCESS,
    accessToken
  })
}

export const signOut = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  await Session.findOneAndDelete({
    refreshToken: token
  })

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })

  return res.status(HTTP_STATUS.OK).json({ message: AUTH_MESSAGES.SIGN_OUT_SUCCESS })
}

export const refreshToken = async (req: Request, res: Response) => {
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
