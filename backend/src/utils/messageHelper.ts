import { ConversationDocument } from '@/models/Conversation.js'
import { MessageDocument } from '@/models/Message.js'
import { Types } from 'mongoose'
import type { AppServer, MessagePayload, NewMessagePayload } from '@/types/socket.types.js'

export const toMessagePayload = (message: MessageDocument): MessagePayload => ({
  _id: message._id.toString(),
  conversationId: message.conversationId.toString(),
  senderId: message.senderId.toString(),
  ...(message.content !== undefined ? { content: message.content } : {}),
  ...(message.imgUrl !== undefined ? { imgUrl: message.imgUrl } : {}),
  createdAt: message.createdAt.toISOString(),
  editedAt: message.editedAt ? message.editedAt.toISOString() : null,
  deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null
})

export const updateConversationAfterCreateMessage = (
  conversation: ConversationDocument,
  message: MessageDocument,
  senderId: Types.ObjectId
) => {
  conversation.set({
    seenBy: [senderId],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      senderId,
      content: message.content,
      imgUrl: message.imgUrl,
      createdAt: message.createdAt
    }
  })

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString()
    const isSender = memberId === senderId.toString()
    const prevCount = conversation.unreadCounts.get(memberId) || 0
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1)
  })
}

export const emitNewMessage = (
  io: AppServer,
  conversation: ConversationDocument,
  message: MessageDocument
) => {
  const conversationId = conversation._id.toString()
  const participantRooms = conversation.participants.map(
    (participant) => `user:${participant.userId.toString()}`
  )

  io.in(participantRooms).socketsJoin(conversationId)

  const createdAt = message.createdAt.toISOString()
  const payload: NewMessagePayload = {
    message: toMessagePayload(message),
    conversation: {
      _id: conversationId,
      lastMessageAt: (conversation.lastMessageAt ?? message.createdAt).toISOString(),
      lastMessage: {
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        ...(message.content !== undefined ? { content: message.content } : {}),
        ...(message.imgUrl !== undefined ? { imgUrl: message.imgUrl } : {}),
        createdAt
      }
    },
    unreadCounts: Object.fromEntries(conversation.unreadCounts.entries())
  }

  io.to(conversationId).emit('new-message', payload)
}

export const emitMessageUpdated = (io: AppServer, message: MessageDocument) => {
  io.to(message.conversationId.toString()).emit('message-updated', toMessagePayload(message))
}
