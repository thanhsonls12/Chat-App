import { authMe } from '@/controllers/userController.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const userRouter = express.Router()

userRouter.get('/me', asyncHandler(authMe))

export default userRouter
