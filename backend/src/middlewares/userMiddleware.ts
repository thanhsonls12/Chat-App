import { USER_MESSAGES } from '@/constants/messages.js'
import { validate } from '@/utils/validation.js'
import { checkSchema } from 'express-validator'

export const updateProfileValidator = validate(
  checkSchema(
    {
      displayName: {
        optional: true,
        isString: { errorMessage: USER_MESSAGES.DISPLAY_NAME_MUST_BE_STRING },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: USER_MESSAGES.DISPLAY_NAME_LENGTH
        },
        trim: true
      },
      bio: {
        optional: true,
        isString: { errorMessage: USER_MESSAGES.BIO_MUST_BE_STRING },
        isLength: {
          options: { max: 500 },
          errorMessage: USER_MESSAGES.BIO_LENGTH
        },
        trim: true
      },
      phone: {
        optional: true,
        isString: { errorMessage: USER_MESSAGES.PHONE_MUST_BE_STRING },
        custom: {
          options: (value: unknown) =>
            value === '' ||
            (typeof value === 'string' && /^\+?[0-9\s().-]{7,20}$/.test(value)),
          errorMessage: USER_MESSAGES.PHONE_MUST_BE_VALID
        },
        trim: true
      }
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      currentPassword: {
        notEmpty: { errorMessage: USER_MESSAGES.CURRENT_PASSWORD_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.CURRENT_PASSWORD_REQUIRED }
      },
      newPassword: {
        notEmpty: { errorMessage: USER_MESSAGES.NEW_PASSWORD_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.NEW_PASSWORD_REQUIRED },
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: USER_MESSAGES.NEW_PASSWORD_LENGTH
        }
      }
    },
    ['body']
  )
)
