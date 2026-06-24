import { ContextRunner, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { AppError, EntityError } from './AppError.js'
import { HTTP_STATUS } from '@/constants/httpStatus.js'
export const validate = (validations: ContextRunner | ContextRunner[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const runners = Array.isArray(validations) ? validations : [validations]

    await Promise.all(runners.map((validation) => validation.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject = errors.mapped()
    const entityErrors = new EntityError({ errors: {} })
    for (const [key, error] of Object.entries(errorsObject)) {
      const { msg } = error
      if (msg instanceof AppError && msg.statusCode !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityErrors.errors[key] = error
    }
    return next(entityErrors)
  }
}
