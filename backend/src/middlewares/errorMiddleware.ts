import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES } from '@/constants/messages.js'
import { AppError, EntityError } from '@/utils/AppError.js'
import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

interface MongoDuplicateKeyError extends Error {
  code: number
  keyPattern?: Record<string, unknown>
}

const isDuplicateKeyError = (error: Error): error is MongoDuplicateKeyError =>
  'code' in error && (error as MongoDuplicateKeyError).code === 11000

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error)

  if (error instanceof EntityError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errors: error.errors
    })
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message
    })
  }

  if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'field'
    return res.status(HTTP_STATUS.CONFLICT).json({
      message: `${field} already exists`
    })
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error.message
    })
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR
  })
}
