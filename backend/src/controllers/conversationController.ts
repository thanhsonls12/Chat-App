import { HTTP_STATUS } from '@/constants/httpStatus.js'
import {
  COMMON_MESSAGES,
  CONVERSATION_MESSAGES,
  MESSAGE_MESSAGES,
  USER_MESSAGES
} from '@/constants/messages.js'
import Conversation from '@/models/Conversation.js'
import type { ConversationDocument } from '@/models/Conversation.js'
import Message from '@/models/Message.js'
import User from '@/models/User.js'
import { AppError } from '@/utils/AppError.js'
import { Types } from 'mongoose'
import type { EmptyRequest, TypedRequest, TypedResponse } from '@/types/api.types.js'
import { io } from '../socket/index.js'
import type {
  AddGroupMembersBody,
  CreateConversationBody,
  GetMessagesParams,
  GetMessagesQuery,
  RemoveMemberParams,
  UpdateGroupBody
} from '@/types/conversation.types.js'

type PopulatedParticipant = {
  userId: {
    _id: Types.ObjectId
    displayName?: string
    avatarUrl?: string
  }
  joined?: Date
}

type PopulatedLastMessage = {
  _id?: string | null
  content?: string | null
  imgUrl?: string | null
  createdAt?: Date | null
  deletedAt?: Date | null
  senderId?: {
    _id: Types.ObjectId
    displayName?: string
    avatarUrl?: string
  } | null
}

const mapParticipants = (participants: unknown) =>
  ((participants ?? []) as PopulatedParticipant[]).map((p) => ({
    _id: p.userId._id,
    displayName: p.userId.displayName ?? '',
    avatarUrl: p.userId.avatarUrl,
    joinedAt: p.joined
  }))

const mapLastMessage = (lastMessage: unknown) => {
  const data = lastMessage as PopulatedLastMessage | null
  if (!data?._id || !data.senderId) return null
  return {
    _id: data._id,
    content: data.content ?? '',
    imgUrl: data.imgUrl ?? null,
    createdAt: data.createdAt ?? null,
    deletedAt: data.deletedAt ?? null,
    sender: {
      _id: data.senderId._id,
      displayName: data.senderId.displayName ?? '',
      avatarUrl: data.senderId.avatarUrl
    }
  }
}

const CONVERSATION_POPULATE = [
  { path: 'participants.userId', select: 'displayName avatarUrl' },
  { path: 'seenBy', select: 'displayName avatarUrl' },
  { path: 'lastMessage.senderId', select: 'displayName avatarUrl' }
]

const formatConversation = (conversation: ConversationDocument) => ({
  ...conversation.toObject({ flattenMaps: true }),
  participants: mapParticipants(conversation.participants),
  lastMessage: mapLastMessage(conversation.lastMessage)
})

const isGroupAdmin = (conversation: ConversationDocument, userId: Types.ObjectId) =>
  conversation.group?.createdBy?.toString() === userId.toString()

const isConversationMember = (conversation: ConversationDocument, userId: Types.ObjectId) =>
  conversation.participants.some((p) => p.userId.toString() === userId.toString())

const removeUserFromConversationRoom = (userId: string, conversationId: string) => {
  const userRoom = `user:${userId}`

  io.in(userRoom).socketsLeave(conversationId)
  io.to(userRoom).emit('removed-from-group', { conversationId })
}

const loadGroupConversation = async (conversationId: string) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  if (conversation.type !== 'group') {
    throw new AppError(CONVERSATION_MESSAGES.GROUP_CONVERSATION_REQUIRED, HTTP_STATUS.BAD_REQUEST)
  }
  return conversation
}

export const createConversation = async (
  req: TypedRequest<CreateConversationBody>,
  res: TypedResponse
) => {
  const { type, name, memberIds } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const userId = req.user._id

  if (type !== 'direct' && type !== 'group') {
    throw new AppError(CONVERSATION_MESSAGES.TYPE_MUST_BE_VALID, HTTP_STATUS.BAD_REQUEST)
  }

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
        name: name ?? null,
        createdBy: userId
      },
      unreadCounts: {}
    })
  }

  if (!conversation) {
    throw new AppError(COMMON_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }

  await conversation.populate(CONVERSATION_POPULATE)

  const formatted = formatConversation(conversation)

  if (type === 'group') {
    const invitedMemberIds = [...new Set(memberIds.map(String))].filter(
      (memberId) => memberId !== userId.toString()
    )
    invitedMemberIds.forEach((memberId) => {
      io.to(`user:${memberId}`).emit('new-group', formatted)
    })
  }

  return res.status(HTTP_STATUS.CREATED).json({
    message: CONVERSATION_MESSAGES.CONVERSATION_CREATED,
    conversation: formatted
  })
}

export const getConversation = async (req: EmptyRequest, res: TypedResponse) => {
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
    const participants = mapParticipants(conversation.participants)
    const otherParticipant = participants.find((p) => p._id.toString() !== userId.toString())

    return {
      ...conversation,
      title:
        conversation.type === 'direct' ? otherParticipant?.displayName : conversation.group?.name,
      avatarUrl: conversation.type === 'direct' ? otherParticipant?.avatarUrl : null,
      unreadCounts: conversation.unreadCounts || {},
      participants,
      lastMessage: mapLastMessage(conversation.lastMessage)
    }
  })

  return res.status(HTTP_STATUS.OK).json({ conversations: formatted })
}

export const getMessages = async (
  req: TypedRequest<unknown, GetMessagesParams, GetMessagesQuery>,
  res: TypedResponse
) => {
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
    $or?: Array<{ createdAt: { $lt: Date } } | { createdAt: Date; _id: { $lt: Types.ObjectId } }>
  } = { conversationId: conversationIdString }

  if (cursor) {
    const [cursorDate, cursorId] = String(cursor).split('_')
    const parsedCursorDate = new Date(cursorDate ?? cursor)
    if (cursorId) {
      query.$or = [
        { createdAt: { $lt: parsedCursorDate } },
        { createdAt: parsedCursorDate, _id: { $lt: new Types.ObjectId(cursorId) } }
      ]
    } else {
      query.$or = [{ createdAt: { $lt: parsedCursorDate } }]
    }
  }

  let messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(parsedLimit + 1)
    .lean()

  let nextCursor

  if (messages.length > parsedLimit) {
    messages.pop()
    const nextMessage = messages[messages.length - 1]
    nextCursor = nextMessage
      ? `${nextMessage.createdAt.toISOString()}_${nextMessage._id.toString()}`
      : undefined
  }

  messages = messages.reverse()

  return res.status(HTTP_STATUS.OK).json({ messages, nextCursor })
}

export const markConversationRead = async (
  req: TypedRequest<unknown, GetMessagesParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { conversationId } = req.params
  const userId = req.user._id
  const conversation = await Conversation.findById(conversationId)

  if (!conversation) {
    throw new AppError(CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.userId.toString() === userId.toString()
  )

  if (!isParticipant) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }

  const alreadySeen = conversation.seenBy.some((id) => id.toString() === userId.toString())

  conversation.unreadCounts.set(userId.toString(), 0)

  if (!alreadySeen) {
    conversation.seenBy.push(userId)
  }
  await conversation.save()

  const lastMessage = conversation.lastMessage
  const lastMessageId = lastMessage?._id?.toString()
  const lastMessageSenderId =
    lastMessage?.senderId != null ? String(lastMessage.senderId) : undefined

  if (lastMessageId && lastMessageSenderId && lastMessageSenderId !== userId.toString()) {
    io.to(String(conversationId)).emit('read-message', {
      conversationId: String(conversationId),
      userId: userId.toString(),
      messageId: lastMessageId
    })
  }

  return res.status(HTTP_STATUS.NO_CONTENT).send()
}

export const getUserConversationsForSocketIO = async (userId: string) => {
  const conversations = await Conversation.find(
    {
      'participants.userId': userId
    },
    {
      _id: 1
    }
  )
  return conversations.map((c) => c._id.toString())
}

export const addGroupMembers = async (
  req: TypedRequest<AddGroupMembersBody, GetMessagesParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { conversationId } = req.params
  const { memberIds } = req.body
  const userId = req.user._id
  const conversation = await loadGroupConversation(conversationId)

  if (!isConversationMember(conversation, userId)) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }

  const existingIds = new Set(conversation.participants.map((p) => p.userId.toString()))
  const newMemberIds = [...new Set(memberIds.map(String))].filter((id) => !existingIds.has(id))

  if (newMemberIds.length === 0) {
    throw new AppError(
      CONVERSATION_MESSAGES.ALL_MEMBERS_ALREADY_IN_GROUP,
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const usersCount = await User.countDocuments({ _id: { $in: newMemberIds } })
  if (usersCount !== newMemberIds.length) {
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  conversation.participants.push(
    ...newMemberIds.map((id) => ({ userId: new Types.ObjectId(id), joined: new Date() }))
  )
  await conversation.save()
  await conversation.populate(CONVERSATION_POPULATE)
  const formatted = formatConversation(conversation)

  io.to(String(conversation._id)).emit('group-updated', formatted)
  newMemberIds.forEach((id) => io.to(`user:${id}`).emit('new-group', formatted))

  return res.status(HTTP_STATUS.OK).json({
    message: CONVERSATION_MESSAGES.MEMBERS_ADDED,
    conversation: formatted
  })
}

export const removeGroupMember = async (
  req: TypedRequest<unknown, RemoveMemberParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { conversationId, memberId } = req.params
  const userId = req.user._id
  const conversation = await loadGroupConversation(conversationId)

  if (!isGroupAdmin(conversation, userId)) {
    throw new AppError(CONVERSATION_MESSAGES.ONLY_ADMIN_CAN_MANAGE, HTTP_STATUS.FORBIDDEN)
  }

  if (memberId === userId.toString()) {
    throw new AppError(CONVERSATION_MESSAGES.CANNOT_REMOVE_YOURSELF, HTTP_STATUS.BAD_REQUEST)
  }

  if (!conversation.participants.some((p) => p.userId.toString() === memberId)) {
    throw new AppError(CONVERSATION_MESSAGES.MEMBER_NOT_IN_GROUP, HTTP_STATUS.NOT_FOUND)
  }

  conversation.set(
    'participants',
    conversation.participants.filter((p) => p.userId.toString() !== memberId)
  )
  conversation.unreadCounts.delete(memberId)
  await conversation.save()
  await conversation.populate(CONVERSATION_POPULATE)
  const formatted = formatConversation(conversation)
  const conversationRoom = String(conversation._id)

  removeUserFromConversationRoom(memberId, conversationRoom)
  io.to(conversationRoom).emit('group-updated', formatted)

  return res.status(HTTP_STATUS.OK).json({
    message: CONVERSATION_MESSAGES.MEMBER_REMOVED,
    conversation: formatted
  })
}

export const leaveGroup = async (
  req: TypedRequest<unknown, GetMessagesParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { conversationId } = req.params
  const userId = req.user._id
  const conversation = await loadGroupConversation(conversationId)

  if (!isConversationMember(conversation, userId)) {
    throw new AppError(CONVERSATION_MESSAGES.NOT_CONVERSATION_MEMBER, HTTP_STATUS.FORBIDDEN)
  }

  const remaining = conversation.participants.filter(
    (p) => p.userId.toString() !== userId.toString()
  )

  if (remaining.length === 0) {
    await conversation.deleteOne()
    removeUserFromConversationRoom(userId.toString(), String(conversation._id))
    return res.status(HTTP_STATUS.OK).json({
      message: CONVERSATION_MESSAGES.LEFT_GROUP,
      conversationId: String(conversation._id)
    })
  }

  if (isGroupAdmin(conversation, userId) && conversation.group) {
    const nextAdmin = remaining.reduce((earliest, current) =>
      (current.joined ?? new Date()) < (earliest.joined ?? new Date()) ? current : earliest
    )
    conversation.group.createdBy = nextAdmin.userId
  }

  conversation.set('participants', remaining)
  conversation.unreadCounts.delete(userId.toString())
  await conversation.save()
  await conversation.populate(CONVERSATION_POPULATE)
  const formatted = formatConversation(conversation)
  const conversationRoom = String(conversation._id)

  removeUserFromConversationRoom(userId.toString(), conversationRoom)
  io.to(conversationRoom).emit('group-updated', formatted)

  return res.status(HTTP_STATUS.OK).json({
    message: CONVERSATION_MESSAGES.LEFT_GROUP,
    conversationId: String(conversation._id),
    conversation: formatted
  })
}

export const updateGroup = async (
  req: TypedRequest<UpdateGroupBody, GetMessagesParams>,
  res: TypedResponse
) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const { conversationId } = req.params
  const { name } = req.body
  const userId = req.user._id
  const conversation = await loadGroupConversation(conversationId)

  if (!isGroupAdmin(conversation, userId)) {
    throw new AppError(CONVERSATION_MESSAGES.ONLY_ADMIN_CAN_MANAGE, HTTP_STATUS.FORBIDDEN)
  }

  if (typeof name === 'string' && name.trim()) {
    conversation.set('group.name', name.trim())
  }

  await conversation.save()
  await conversation.populate(CONVERSATION_POPULATE)
  const formatted = formatConversation(conversation)

  io.to(String(conversation._id)).emit('group-updated', formatted)

  return res.status(HTTP_STATUS.OK).json({
    message: CONVERSATION_MESSAGES.GROUP_UPDATED,
    conversation: formatted
  })
}
