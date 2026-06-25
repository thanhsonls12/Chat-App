import {
  createConversation,
  getConversation,
  getMessages
} from '@/controllers/conversationController.js'
import {
  createConversationValidator,
  getMessagesValidator
} from '@/middlewares/conversationMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const conversationRouter = express.Router()

conversationRouter.post('/', createConversationValidator, asyncHandler(createConversation))

conversationRouter.get('/', asyncHandler(getConversation))

conversationRouter.get('/:conversationId/messages', getMessagesValidator, asyncHandler(getMessages))
export default conversationRouter
