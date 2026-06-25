import { HTTP_STATUS } from '@/constants/httpStatus.js'
import {
  COMMON_MESSAGES,
  CONVERSATION_MESSAGES,
  MESSAGE_MESSAGES,
  USER_MESSAGES
} from '@/constants/messages.js'
import Conversation from '@/models/Conversation.js'
import Message from '@/models/Message.js'
import User from '@/models/User.js'
import { AppError } from '@/utils/AppError.js'
import { updateConversationAfterCreateMessage } from '@/utils/messageHelper.js'
import { Request, Response } from 'express'
export const sendDirectMessage = async (req: Request, res: Response) => {
  const { recipientId, content, conversationId, imgUrl } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const senderId = req.user._id

  let conversation
  if (conversationId) {
    conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === senderId.toString()
    )

    if (!isParticipant) {
      throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
    }

    if (conversation.type !== 'direct') {
      throw new AppError(
        CONVERSATION_MESSAGES.DIRECT_CONVERSATION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST
      )
    }
  } else {
    const recipient = await User.findById(recipientId)

    if (!recipient) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': {
        $all: [senderId, recipientId]
      }
    })
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [{ userId: senderId }, { userId: recipientId }]
      })
    }
  }

  if (!content && !imgUrl) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
    imgUrl
  })

  updateConversationAfterCreateMessage(conversation, message, senderId)

  await conversation.save()

  return res.status(HTTP_STATUS.CREATED).json({
    message: MESSAGE_MESSAGES.MESSAGE_SENT,
    data: message
  })
}

export const sendGroupMessage = async (req: Request, res: Response) => {
  const { conversationId, content, imgUrl } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const senderId = req.user._id

  const conversation = await Conversation.findById(conversationId)

  if (!conversation) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (conversation.type !== 'group') {
    throw new AppError(CONVERSATION_MESSAGES.GROUP_CONVERSATION_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const isParticipant = conversation.participants.some(
    (p) => p.userId.toString() === senderId.toString()
  )

  if (!isParticipant) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }

  if (!content && !imgUrl) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
    imgUrl
  })

  updateConversationAfterCreateMessage(conversation, message, senderId)

  await conversation.save()

  return res.status(HTTP_STATUS.CREATED).json({
    message: MESSAGE_MESSAGES.MESSAGE_SENT,
    data: message
  })
}
