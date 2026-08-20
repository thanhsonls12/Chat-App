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
import { emitMessageUpdated, emitNewMessage, updateConversationAfterCreateMessage } from '@/utils/messageHelper.js'
import { uploadImageFromBuffer } from '@/middlewares/uploadMiddleware.js'
import type { TypedRequest, TypedResponse } from '@/types/api.types.js'
import type {
  EditMessageBody,
  MessageIdParams,
  SendDirectMessageBody,
  SendGroupMessageBody
} from '@/types/message.types.js'
import { io } from '../socket/index.js'

interface CreatedMessageResult {
  conversation: ConversationDocument
  message: MessageDocument
}

const uploadMessageImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const result = await uploadImageFromBuffer(file.buffer, {
      folder: 'chat-app/messages',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    })
    return result.secure_url
  } catch (error) {
    console.error('Unable to upload message image', error)
    throw new AppError(COMMON_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
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
  const { recipientId, content, conversationId } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  if (!content && !req.file) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const senderId = req.user._id

  if (conversationId) {
    const existing = await Conversation.findById(conversationId)
    if (!existing) {
      throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    assertConversationMember(existing, senderId)
    if (existing.type !== 'direct') {
      throw new AppError(CONVERSATION_MESSAGES.DIRECT_CONVERSATION_REQUIRED, HTTP_STATUS.BAD_REQUEST)
    }
  } else {
    if (!recipientId) {
      throw new AppError(MESSAGE_MESSAGES.RECIPIENT_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST)
    }
    const recipient = await User.findById(recipientId)
    if (!recipient) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
  }

  const imgUrl = req.file ? await uploadMessageImage(req.file) : undefined

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

const loadOwnLiveMessage = async (
  messageId: string,
  userId: Types.ObjectId,
  forbiddenMessage: string,
  session: ClientSession
) => {
  const message = await Message.findById(messageId).session(session)

  if (!message) {
    throw new AppError(MESSAGE_MESSAGES.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new AppError(forbiddenMessage, HTTP_STATUS.FORBIDDEN)
  }

  if (message.deletedAt) {
    throw new AppError(MESSAGE_MESSAGES.MESSAGE_ALREADY_DELETED, HTTP_STATUS.BAD_REQUEST)
  }

  const conversation = await Conversation.findById(message.conversationId).session(session)

  if (!conversation) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  assertConversationMember(conversation, userId)

  return { message, conversation }
}

const syncLastMessage = async (
  conversation: ConversationDocument,
  message: MessageDocument,
  session: ClientSession
) => {
  if (conversation.lastMessage?._id?.toString() !== message._id.toString()) return

  conversation.set({
    lastMessage: {
      _id: conversation.lastMessage._id,
      senderId: conversation.lastMessage.senderId,
      createdAt: conversation.lastMessage.createdAt,
      content: message.content ?? null,
      imgUrl: message.imgUrl ?? null,
      deletedAt: message.deletedAt ?? null
    }
  })
  await conversation.save({ session })
}

export const editMessage = async (
  req: TypedRequest<EditMessageBody, MessageIdParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { messageId } = req.params
  const content = req.body.content?.trim()

  if (!content) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const userId = req.user._id

  const message = await mongoose.connection.transaction(async (session) => {
    const { message, conversation } = await loadOwnLiveMessage(
      messageId,
      userId,
      MESSAGE_MESSAGES.FORBIDDEN_EDIT_MESSAGE,
      session
    )

    if (!message.content) {
      throw new AppError(
        MESSAGE_MESSAGES.CANNOT_EDIT_IMAGE_ONLY_MESSAGE,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    message.set({ content, editedAt: new Date() })
    await message.save({ session })
    await syncLastMessage(conversation, message, session)

    return message
  })

  emitMessageUpdated(io, message)

  return res.status(HTTP_STATUS.OK).json({
    message: MESSAGE_MESSAGES.MESSAGE_UPDATED,
    data: message
  })
}

export const deleteMessage = async (
  req: TypedRequest<unknown, MessageIdParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { messageId } = req.params
  const userId = req.user._id

  const message = await mongoose.connection.transaction(async (session) => {
    const { message, conversation } = await loadOwnLiveMessage(
      messageId,
      userId,
      MESSAGE_MESSAGES.FORBIDDEN_DELETE_MESSAGE,
      session
    )

    message.set({ content: null, imgUrl: null, deletedAt: new Date() })
    await message.save({ session })
    await syncLastMessage(conversation, message, session)

    return message
  })

  emitMessageUpdated(io, message)

  return res.status(HTTP_STATUS.OK).json({
    message: MESSAGE_MESSAGES.MESSAGE_DELETED,
    data: message
  })
}

export const sendGroupMessage = async (
  req: TypedRequest<SendGroupMessageBody>,
  res: TypedResponse
) => {
  const { conversationId, content } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  if (!content && !req.file) {
    throw new AppError(MESSAGE_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  const senderId = req.user._id

  const existing = await Conversation.findById(conversationId)
  if (!existing) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (existing.type !== 'group') {
    throw new AppError(CONVERSATION_MESSAGES.GROUP_CONVERSATION_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }

  assertConversationMember(existing, senderId)

  const imgUrl = req.file ? await uploadMessageImage(req.file) : undefined

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
