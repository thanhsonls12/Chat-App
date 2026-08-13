import {
  authMe,
  changePassword,
  searchUserByUsername,
  updateProfile,
  uploadAvatar
} from '@/controllers/userController.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'
import { checkSchema } from 'express-validator'
import { validate } from '@/utils/validation.js'
import { USER_MESSAGES } from '@/constants/messages.js'
import { upload } from '@/middlewares/uploadMiddleware.js'
import {
  changePasswordValidator,
  updateProfileValidator
} from '@/middlewares/userMiddleware.js'

const userRouter = express.Router()

userRouter.get('/me', asyncHandler(authMe))

userRouter.patch('/me', updateProfileValidator, asyncHandler(updateProfile))

userRouter.patch('/me/password', changePasswordValidator, asyncHandler(changePassword))

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

userRouter.post('/uploadAvatar', upload.single('file'), asyncHandler(uploadAvatar))

export default userRouter
