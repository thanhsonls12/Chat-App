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
import { Request, Response } from 'express'
import { Types } from 'mongoose'

type PopulatedParticipant = {
  userId: {
    _id: Types.ObjectId
    displayName?: string
    avatarUrl?: string
  }
  joined?: Date
}

export const createConversation = async (req: Request, res: Response) => {
  const { type, name, memberIds } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const userId = req.user._id

  let conversation
  if (type === 'direct') {
    const participantId = memberIds[0]
    if (participantId === userId.toString()) {
      throw new AppError(MESSAGE_MESSAGES.CANNOT_MESSAGE_YOURSELF, HTTP_STATUS.BAD_REQUEST)
    }
    const userExists = await User.exists({ _id: participantId })
    if (!userExists) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': {
        $all: [userId, participantId]
      }
    })

    if (!conversation) {
      conversation = new Conversation({
        type: 'direct',
        participants: [
          {
            userId
          },
          {
            userId: participantId
          }
        ]
      })
      await conversation.save()
    }
  }

  if (type === 'group') {
    const uniqueMemberIds = [...new Set(memberIds.map(String))].filter(
      (id) => id !== userId.toString()
    )
    const participantIds = [userId.toString(), ...uniqueMemberIds]
    const usersCount = await User.countDocuments({ _id: { $in: participantIds } })
    if (usersCount !== participantIds.length) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    conversation = await Conversation.create({
      type: 'group',
      participants: participantIds.map((id) => ({
        userId: id
      })),
      group: {
        name,
        createdBy: userId
      },
      unreadCounts: {}
    })
  }

  if (!conversation) {
    throw new AppError(COMMON_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }

  await conversation.populate([
    { path: 'participants.userId', select: 'displayName avatarUrl' },
    {
      path: 'seenBy',
      select: 'displayName avatarUrl'
    },
    {
      path: 'lastMessage.senderId',
      select: 'displayName avatarUrl'
    }
  ])

  return res.status(HTTP_STATUS.CREATED).json({
    message: CONVERSATION_MESSAGES.CONVERSATION_CREATED,
    conversation
  })
}

export const getConversation = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const userId = req.user._id

  const conversations = await Conversation.find({
    'participants.userId': userId
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate({
      path: 'participants.userId',
      select: 'displayName avatarUrl'
    })
    .populate({
      path: 'lastMessage.senderId',
      select: 'displayName avatarUrl'
    })
    .populate({
      path: 'seenBy',
      select: 'displayName avatarUrl'
    })
    .lean()

  const formatted = conversations.map((conversation) => {
    const participants = ((conversation.participants || []) as PopulatedParticipant[]).map((p) => ({
      _id: p.userId._id,
      displayName: p.userId.displayName,
      avatarUrl: p.userId.avatarUrl,
      joinedAt: p.joined
    }))

    const otherParticipant = participants.find((p) => p._id.toString() !== userId.toString())

    return {
      ...conversation,
      title:
        conversation.type === 'direct' ? otherParticipant?.displayName : conversation.group?.name,
      avatarUrl: conversation.type === 'direct' ? otherParticipant?.avatarUrl : null,
      unreadCounts: conversation.unreadCounts || {},
      participants
    }
  })

  return res.status(HTTP_STATUS.OK).json({ conversations: formatted })
}

export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params
  const { limit = 50, cursor } = req.query
  if (!conversationId) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const conversationIdString = String(conversationId)

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const userId = req.user._id
  const parsedLimit = Math.min(Number(limit) || 50, 100)
  const conversation = await Conversation.findById(conversationIdString)

  if (!conversation) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const isParticipant = conversation.participants.some(
    (p) => p.userId.toString() === userId.toString()
  )

  if (!isParticipant) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }

  const query: {
    conversationId: string
    createdAt?: {
      $lt: Date
    }
  } = { conversationId: conversationIdString }

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor as string) }
  }

  let messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit + 1)
    .populate({
      path: 'senderId',
      select: 'displayName avatarUrl'
    })
    .lean()

  let nextCursor

  if (messages.length > parsedLimit) {
    const nextMessage = messages[messages.length - 1]
    nextCursor = nextMessage?.createdAt.toISOString()
    messages.pop()
  }

  messages = messages.reverse()

  conversation.unreadCounts.set(userId.toString(), 0)

  if (!conversation.seenBy.some((id) => id.toString() === userId.toString())) {
    conversation.seenBy.push(userId)
  }

  await conversation.save()

  return res.status(HTTP_STATUS.OK).json({ messages, nextCursor })
}
