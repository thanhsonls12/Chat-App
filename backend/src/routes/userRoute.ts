import { authMe, searchUserByUsername } from '@/controllers/userController.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'
import { checkSchema } from 'express-validator'
import { validate } from '@/utils/validation.js'
import { USER_MESSAGES } from '@/constants/messages.js'

const userRouter = express.Router()

userRouter.get('/me', asyncHandler(authMe))

userRouter.get(
  '/search',
  validate(
    checkSchema(
      {
        username: {
          notEmpty: { errorMessage: USER_MESSAGES.USERNAME_QUERY_REQUIRED },
          isString: { errorMessage: USER_MESSAGES.USERNAME_QUERY_MUST_BE_STRING },
          isLength: {
            options: { min: 3, max: 50 },
            errorMessage: USER_MESSAGES.USERNAME_QUERY_LENGTH
          },
          trim: true
        }
      },
      ['query']
    )
  ),
  asyncHandler(searchUserByUsername)
)

export default userRouter
