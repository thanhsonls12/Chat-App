import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { FRIEND_MESSAGES } from '@/constants/messages.js'
import { AppError } from '@/utils/AppError.js'
import { validate } from '@/utils/validation.js'
import { checkSchema } from 'express-validator'

export const sendFriendRequestValidator = validate(
  checkSchema(
    {
      to: {
        notEmpty: {
          errorMessage: FRIEND_MESSAGES.RECEIVER_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: FRIEND_MESSAGES.RECEIVER_ID_MUST_BE_MONGO_ID
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            if (value === req.user._id.toString()) {
              throw new AppError(
                FRIEND_MESSAGES.CANNOT_SEND_FRIEND_REQUEST,
                HTTP_STATUS.BAD_REQUEST
              )
            }
            return true
          }
        }
      },
      message: {
        optional: true,
        isString: {
          errorMessage: FRIEND_MESSAGES.MESSAGE_MUST_BE_STRING
        },
        isLength: {
          options: { max: 300 },
          errorMessage: FRIEND_MESSAGES.MESSAGE_LENGTH
        },
        trim: true
      }
    },
    ['body']
  )
)

export const friendRequestIdValidator = validate(
  checkSchema(
    {
      requestId: {
        isMongoId: {
          errorMessage: FRIEND_MESSAGES.RECEIVER_ID_MUST_BE_MONGO_ID
        }
      }
    },
    ['params']
  )
)
