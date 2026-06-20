import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES } from '@/constants/messages.js'
import { AppError } from '@/utils/AppError.js'
import { Request, Response, NextFunction } from 'express'
export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message
    })
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR
  })
}
