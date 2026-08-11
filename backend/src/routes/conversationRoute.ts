import {
  createConversation,
  getConversation,
  getMessages,
  markConversationRead
} from '@/controllers/conversationController.js'
import {
  createConversationValidator,
  getMessagesValidator
} from '@/middlewares/conversationMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'
import type { GetMessagesParams, GetMessagesQuery } from '@/types/conversation.types.js'

const conversationRouter = express.Router()

conversationRouter.post('/', createConversationValidator, asyncHandler(createConversation))

conversationRouter.get('/', asyncHandler(getConversation))

conversationRouter.get<GetMessagesParams, unknown, unknown, GetMessagesQuery>(
  '/:conversationId/messages',
  getMessagesValidator,
  asyncHandler(getMessages)
)

conversationRouter.patch<GetMessagesParams>(
  '/:conversationId/read',
  getMessagesValidator,
  asyncHandler(markConversationRead)
)
export default conversationRouter
