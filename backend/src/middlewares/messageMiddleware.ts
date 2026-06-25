import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { CONVERSATION_MESSAGES, MESSAGE_MESSAGES } from '@/constants/messages.js'
import { AppError } from '@/utils/AppError.js'
import { validate } from '@/utils/validation.js'
import { checkSchema } from 'express-validator'

export const sendDirectMessageValidator = validate(
  checkSchema(
    {
      recipientId: {
        optional: true,
        isMongoId: {
          errorMessage: MESSAGE_MESSAGES.RECIPIENT_ID_MUST_BE_MONGO_ID
        },
        custom: {
          options: (value, { req }) => {
            if (!value && !req.body.conversationId) {
              throw new AppError(MESSAGE_MESSAGES.RECIPIENT_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST)
            }

            if (value && value === req.user._id.toString()) {
              throw new AppError(MESSAGE_MESSAGES.CANNOT_MESSAGE_YOURSELF, HTTP_STATUS.BAD_REQUEST)
            }
            return true
          }
        }
      },
      content: {
        optional: true,
        isString: {
          errorMessage: MESSAGE_MESSAGES.CONTENT_MUST_BE_STRING
        },
        isLength: {
          options: { max: 2000 },
          errorMessage: MESSAGE_MESSAGES.CONTENT_LENGTH
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            if (!value && !req.body.imgUrl) {
              throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
            }

            return true
          }
        }
      },
      imgUrl: {
        optional: true,
        isString: {
          errorMessage: MESSAGE_MESSAGES.IMAGE_URL_MUST_BE_STRING
        }
      },
      conversationId: {
        optional: true,
        isMongoId: {
          errorMessage: MESSAGE_MESSAGES.CONVERSATION_ID_MUST_BE_MONGO_ID
        }
      }
    },
    ['body']
  )
)

export const sendGroupMessageValidator = validate(
  checkSchema(
    {
      conversationId: {
        notEmpty: {
          errorMessage: CONVERSATION_MESSAGES.CONVERSATION_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: CONVERSATION_MESSAGES.CONVERSATION_ID_MUST_BE_MONGO_ID
        }
      },
      content: {
        optional: true,
        isString: {
          errorMessage: MESSAGE_MESSAGES.CONTENT_MUST_BE_STRING
        },
        isLength: {
          options: { max: 2000 },
          errorMessage: MESSAGE_MESSAGES.CONTENT_LENGTH
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            if (!value && !req.body.imgUrl) {
              throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
            }
            return true
          }
        }
      },
      imgUrl: {
        optional: true,
        isString: {
          errorMessage: MESSAGE_MESSAGES.IMAGE_URL_MUST_BE_STRING
        }
      }
    },
    ['body']
  )
)
