import { ConversationDocument } from '@/models/Conversation.js'
import { MessageDocument } from '@/models/Message.js'
import { Types } from 'mongoose'

export const updateConversationAfterCreateMessage = (
  conversation: ConversationDocument,
  message: MessageDocument,
  senderId: Types.ObjectId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      senderId,
      content: message.content,
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
