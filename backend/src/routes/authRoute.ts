import { refreshToken, signIn, signOut, signUp } from '@/controllers/authController.js'
import { signInValidator, signUpValidator } from '@/middlewares/authMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const authRouter = express.Router()

authRouter.post('/signup', signUpValidator, asyncHandler(signUp))

authRouter.post('/signin', signInValidator, asyncHandler(signIn))

authRouter.post('/signout', asyncHandler(signOut))

authRouter.post('/refresh', asyncHandler(refreshToken))

export default authRouter
