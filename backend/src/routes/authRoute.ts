import { signIn, signOut, signUp } from '@/controllers/authController.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const authRouter = express.Router()

authRouter.post('/signup', asyncHandler(signUp))

authRouter.post('/signin', asyncHandler(signIn))

authRouter.post('/signout', asyncHandler(signOut))

export default authRouter
