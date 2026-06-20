import { AccessTokenPayload } from '@/types/auth.types.js'
import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import { envConfig } from '@/config/env.js'
const ACCESS_TOKEN_TTL: SignOptions['expiresIn'] = '30m'

export const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId }, envConfig.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })

export const verifyAccessToken = (token: string) => {
  const decoded = jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET)
  if (typeof decoded === 'string' || !('userId' in decoded)) {
    throw new Error('Invalid access token')
  }
  return decoded as AccessTokenPayload
}

export const generateRefreshToken = (): string => crypto.randomBytes(64).toString('hex')
