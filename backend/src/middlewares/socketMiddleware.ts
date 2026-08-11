import { verifyAccessToken } from '@/utils/jwt.js'
import User from '@/models/User.js'
import type { AppSocket, SocketNext } from '@/types/socket.types.js'

export const socketAuthMiddleware = async (socket: AppSocket, next: SocketNext) => {
  try {
    const token: unknown = socket.handshake.auth?.token
    if (typeof token !== 'string' || !token) {
      return next(new Error('Unauthorized'))
    }
    const { userId } = verifyAccessToken(token)
    if (!userId) {
      return next(new Error('Unauthorized'))
    }
    const user = await User.findById(userId).select('-hashedPassword')
    if (!user) {
      return next(new Error('User not found'))
    }
    socket.data.user = user
    next()
  } catch (error) {
    next(error instanceof Error ? error : new Error('Authentication failed'))
  }
}
