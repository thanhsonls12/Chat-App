import { authMe } from '@/controllers/userController.js'
import express from 'express'

const userRouter = express.Router()

userRouter.get('/me', authMe)

export default userRouter
