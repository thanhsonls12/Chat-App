import { sendDirectMessage, sendGroupMessage } from '@/controllers/messageController.js'
import {
  sendDirectMessageValidator,
  sendGroupMessageValidator
} from '@/middlewares/messageMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const messageRouter = express.Router()

messageRouter.post('/direct', sendDirectMessageValidator, asyncHandler(sendDirectMessage))

messageRouter.post('/group', sendGroupMessageValidator, asyncHandler(sendGroupMessage))

export default messageRouter
