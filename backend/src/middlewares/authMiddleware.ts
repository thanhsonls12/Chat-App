import { Request, Response, NextFunction } from 'express'
import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES, USER_MESSAGES } from '@/constants/messages.js'
import User from '@/models/User.js'
import { verifyAccessToken } from '@/utils/jwt.js'

export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']

    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: COMMON_MESSAGES.UNAUTHORIZED })
    }
    const { userId } = verifyAccessToken(token)
    const user = await User.findById(userId).select('-hashedPassword')
    if (!user)
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USER_MESSAGES.USER_NOT_FOUND
      })
    req.user = user
    return next()
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: COMMON_MESSAGES.UNAUTHORIZED })
  }
}
