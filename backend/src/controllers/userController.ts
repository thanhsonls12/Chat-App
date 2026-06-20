import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES } from '@/constants/messages.js'

import { AppError } from '@/utils/AppError.js'
import { Request, Response } from 'express'
export const authMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  return res.status(HTTP_STATUS.OK).json({
    user: req.user
  })
}
