import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { CONVERSATION_MESSAGES } from '@/constants/messages.js'
import { AppError } from '@/utils/AppError.js'
import { validate } from '@/utils/validation.js'
import { checkSchema } from 'express-validator'

export const createConversationValidator = validate(
  checkSchema(
    {
      type: {
        notEmpty: {
          errorMessage: CONVERSATION_MESSAGES.TYPE_REQUIRED
        },
        isIn: {
          options: [['direct', 'group']],
          errorMessage: CONVERSATION_MESSAGES.TYPE_MUST_BE_VALID
        }
      },
      name: {
        optional: true,
        isString: {
          errorMessage: CONVERSATION_MESSAGES.GROUP_NAME_MUST_BE_STRING
        },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: CONVERSATION_MESSAGES.GROUP_NAME_LENGTH
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            if (req.body.type === 'group' && !value) {
              throw new AppError(CONVERSATION_MESSAGES.GROUP_NAME_REQUIRED, HTTP_STATUS.BAD_REQUEST)
            }
            return true
          }
        }
      },
      memberIds: {
        notEmpty: {
          errorMessage: CONVERSATION_MESSAGES.MEMBER_IDS_REQUIRED
        },
        isArray: {
          errorMessage: CONVERSATION_MESSAGES.MEMBER_IDS_MUST_BE_ARRAY
        },
        custom: {
          options: (value, { req }) => {
            if (req.body.type === 'direct' && value.length !== 1) {
              throw new AppError(
                CONVERSATION_MESSAGES.DIRECT_CONVERSATION_REQUIRES_ONE_MEMBER,
                HTTP_STATUS.BAD_REQUEST
              )
            }

            if (req.body.type === 'group' && value.length < 1) {
              throw new AppError(
                CONVERSATION_MESSAGES.GROUP_REQUIRES_MEMBERS,
                HTTP_STATUS.BAD_REQUEST
              )
            }

            return true
          }
        }
      },
      'memberIds.*': {
        isMongoId: {
          errorMessage: CONVERSATION_MESSAGES.MEMBER_ID_MUST_BE_MONGO_ID
        }
      }
    },
    ['body']
  )
)

export const getMessagesValidator = validate(
  checkSchema({
    conversationId: {
      in: ['params'],
      notEmpty: {
        errorMessage: CONVERSATION_MESSAGES.CONVERSATION_ID_REQUIRED
      },
      isMongoId: {
        errorMessage: CONVERSATION_MESSAGES.CONVERSATION_ID_MUST_BE_MONGO_ID
      }
    },
    limit: {
      in: ['query'],
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: CONVERSATION_MESSAGES.MESSAGE_LIMIT_MUST_BE_VALID
      }
    },
    cursor: {
      in: ['query'],
      optional: true,
      custom: {
        options: (value) => {
          if (typeof value !== 'string') return false

          const separatorIndex = value.lastIndexOf('_')
          const cursorDate =
            separatorIndex === -1 ? value : value.slice(0, separatorIndex)
          const cursorId =
            separatorIndex === -1 ? undefined : value.slice(separatorIndex + 1)

          const isValidDate =
            cursorDate.length > 0 && !Number.isNaN(Date.parse(cursorDate))
          const isValidId =
            cursorId === undefined || /^[a-fA-F0-9]{24}$/.test(cursorId)

          return isValidDate && isValidId
        },
        errorMessage: CONVERSATION_MESSAGES.MESSAGE_CURSOR_MUST_BE_DATE
      }
    }
  })
)
