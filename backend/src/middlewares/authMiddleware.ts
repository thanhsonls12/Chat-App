import { Request, Response, NextFunction } from 'express'
import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { AUTH_MESSAGES, COMMON_MESSAGES, USER_MESSAGES } from '@/constants/messages.js'
import User from '@/models/User.js'
import { verifyAccessToken } from '@/utils/jwt.js'
import { AppError } from '@/utils/AppError.js'
import { validate } from '@/utils/validation.js'
import { checkSchema } from 'express-validator'

export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']

  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const { userId } = verifyAccessToken(token)
  const user = await User.findById(userId).select('-hashedPassword')
  if (!user) throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  req.user = user
  return next()
}

export const signUpValidator = validate(
  checkSchema(
    {
      firstName: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.FIRST_NAME_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.FIRST_NAME_MUST_BE_STRING
        },
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: AUTH_MESSAGES.FIRST_NAME_LENGTH
        },
        trim: true
      },
      lastName: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.LAST_NAME_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.LAST_NAME_MUST_BE_STRING
        },
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: AUTH_MESSAGES.LAST_NAME_LENGTH
        },
        trim: true
      },
      username: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.USERNAME_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.USERNAME_MUST_BE_STRING
        },
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: AUTH_MESSAGES.USERNAME_LENGTH
        },
        trim: true,
        custom: {
          options: async (value) => {
            const user = await User.findOne({ username: value })
            if (user) {
              throw new AppError(AUTH_MESSAGES.USERNAME_ALREADY_EXISTS, HTTP_STATUS.CONFLICT)
            }
            return true
          }
        }
      },
      email: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.EMAIL_REQUIRED
        },
        isEmail: {
          errorMessage: AUTH_MESSAGES.EMAIL_MUST_BE_VALID
        },
        normalizeEmail: true,
        trim: true,
        custom: {
          options: async (value) => {
            const user = await User.findOne({ email: value })
            if (user) {
              throw new AppError(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRING
        },
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: AUTH_MESSAGES.PASSWORD_LENGTH
        }
      }
    },
    ['body']
  )
)

export const signInValidator = validate(
  checkSchema(
    {
      username: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.USERNAME_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.USERNAME_MUST_BE_STRING
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: AUTH_MESSAGES.PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRING
        }
      }
    },
    ['body']
  )
)
