import { AccessTokenPayload } from '@/types/auth.types.js'
import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import { envConfig } from '@/config/env.js'
import { AppError } from './AppError.js'
import { HTTP_STATUS } from '@/constants/httpStatus.js'
const ACCESS_TOKEN_TTL: SignOptions['expiresIn'] = '30m'

export const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000

export const MAX_ACTIVE_SESSIONS_PER_USER = 5

export const hashRefreshToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex')

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId }, envConfig.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })

export const verifyAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET)

    if (typeof decoded === 'string' || !('userId' in decoded)) {
      throw new AppError('Invalid access token', HTTP_STATUS.UNAUTHORIZED)
    }
    return decoded as AccessTokenPayload
  } catch {
    throw new AppError('Invalid access token', HTTP_STATUS.UNAUTHORIZED)
  }
}

export const generateRefreshToken = (): string => crypto.randomBytes(64).toString('hex')
