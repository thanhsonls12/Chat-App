import { HTTP_STATUS } from '@/constants/httpStatus.js'

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: unknown
  }
>

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class EntityError extends AppError {
  errors: ErrorType
  constructor({ message = 'Validation Error', errors }: { message?: string; errors: ErrorType }) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY)
    this.errors = errors
  }
}
