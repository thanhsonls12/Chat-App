import mongoose, { type ClientSession, type Types } from 'mongoose'
import { HTTP_STATUS } from '@/constants/httpStatus.js'
import {
  COMMON_MESSAGES,
  CONVERSATION_MESSAGES,
  MESSAGE_MESSAGES,
  USER_MESSAGES
} from '@/constants/messages.js'
import Conversation, { type ConversationDocument } from '@/models/Conversation.js'
import Message, { type MessageDocument } from '@/models/Message.js'
import User from '@/models/User.js'
import { AppError } from '@/utils/AppError.js'
import { emitNewMessage, updateConversationAfterCreateMessage } from '@/utils/messageHelper.js'
import type { TypedRequest, TypedResponse } from '@/types/api.types.js'
import type { SendDirectMessageBody, SendGroupMessageBody } from '@/types/message.types.js'
import { io } from '../socket/index.js'

interface CreatedMessageResult {
  conversation: ConversationDocument
  message: MessageDocument
}

const createMessageAndUpdateConversation = async (
  conversation: ConversationDocument,
  senderId: Types.ObjectId,
  content: string | undefined,
  imgUrl: string | undefined,
  session: ClientSession
) => {
  const message = new Message({
    conversationId: conversation._id,
    senderId,
    ...(content !== undefined ? { content } : {}),
    ...(imgUrl !== undefined ? { imgUrl } : {})
  })

  await message.save({ session })
  updateConversationAfterCreateMessage(conversation, message, senderId)
  await conversation.save({ session })

  return message
}

const assertConversationMember = (
  conversation: ConversationDocument,
  userId: Types.ObjectId
) => {
  const isParticipant = conversation.participants.some(
    (participant) => participant.userId.toString() === userId.toString()
  )

  if (!isParticipant) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }
}

export const sendDirectMessage = async (
  req: TypedRequest<SendDirectMessageBody>,
  res: TypedResponse
) => {
  const { recipientId, content, conversationId, imgUrl } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  if (!content && !imgUrl) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const senderId = req.user._id
  const result = await mongoose.connection.transaction(
    async (session): Promise<CreatedMessageResult> => {
      let conversation: ConversationDocument | null

      if (conversationId) {
        conversation = await Conversation.findById(conversationId).session(session)
        if (!conversation) {
          throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
        }

        assertConversationMember(conversation, senderId)
        if (conversation.type !== 'direct') {
          throw new AppError(
            CONVERSATION_MESSAGES.DIRECT_CONVERSATION_REQUIRED,
            HTTP_STATUS.BAD_REQUEST
          )
        }
      } else {
        if (!recipientId) {
          throw new AppError(MESSAGE_MESSAGES.RECIPIENT_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST)
        }

        const recipient = await User.findById(recipientId).session(session)
        if (!recipient) {
          throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
        }

        conversation = await Conversation.findOne({
          type: 'direct',
          'participants.userId': { $all: [senderId, recipientId] }
        }).session(session)

        if (!conversation) {
          conversation = new Conversation({
            type: 'direct',
            participants: [{ userId: senderId }, { userId: recipientId }]
          })
          await conversation.save({ session })
        }
      }

      const message = await createMessageAndUpdateConversation(
        conversation,
        senderId,
        content,
        imgUrl,
        session
      )
      return { conversation, message }
    }
  )

  emitNewMessage(io, result.conversation, result.message)

  return res.status(HTTP_STATUS.CREATED).json({
    message: MESSAGE_MESSAGES.MESSAGE_SENT,
    data: result.message
  })
}

export const sendGroupMessage = async (
  req: TypedRequest<SendGroupMessageBody>,
  res: TypedResponse
) => {
  const { conversationId, content, imgUrl } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  if (!content && !imgUrl) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const senderId = req.user._id
  const result = await mongoose.connection.transaction(
    async (session): Promise<CreatedMessageResult> => {
      const conversation = await Conversation.findById(conversationId).session(session)
      if (!conversation) {
        throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      if (conversation.type !== 'group') {
        throw new AppError(
          CONVERSATION_MESSAGES.GROUP_CONVERSATION_REQUIRED,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      assertConversationMember(conversation, senderId)
      const message = await createMessageAndUpdateConversation(
        conversation,
        senderId,
        content,
        imgUrl,
        session
      )
      return { conversation, message }
    }
  )

  emitNewMessage(io, result.conversation, result.message)

  return res.status(HTTP_STATUS.CREATED).json({
    message: MESSAGE_MESSAGES.MESSAGE_SENT,
    data: result.message
  })
}
