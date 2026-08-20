import {
  deleteMessage,
  editMessage,
  sendDirectMessage,
  sendGroupMessage
} from '@/controllers/messageController.js'
import {
  deleteMessageValidator,
  editMessageValidator,
  sendDirectMessageValidator,
  sendGroupMessageValidator
} from '@/middlewares/messageMiddleware.js'
import { upload } from '@/middlewares/uploadMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'
import type { EditMessageBody, MessageIdParams } from '@/types/message.types.js'

const messageRouter = express.Router()

messageRouter.post(
  '/direct',
  upload.single('image'),
  sendDirectMessageValidator,
  asyncHandler(sendDirectMessage)
)

messageRouter.post(
  '/group',
  upload.single('image'),
  sendGroupMessageValidator,
  asyncHandler(sendGroupMessage)
)

messageRouter.patch<MessageIdParams, unknown, EditMessageBody>(
  '/:messageId',
  editMessageValidator,
  asyncHandler(editMessage)
)

messageRouter.delete<MessageIdParams>(
  '/:messageId',
  deleteMessageValidator,
  asyncHandler(deleteMessage)
)

export default messageRouter
