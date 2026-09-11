import mongoose, { Types } from 'mongoose'
import Conversation from '@/models/Conversation.js'
import Message, { type MessageDocument } from '@/models/Message.js'
import type { AppServer } from '@/types/socket.types.js'
import { emitNewMessage, updateConversationAfterCreateMessage } from './messageHelper.js'

export type CallRecordStatus = 'ended' | 'rejected' | 'missed'

interface CallRecordInput {
  callId: string
  conversationId: string
  callerId: string
  status: CallRecordStatus
  duration: number
}

export const persistCallRecord = async (io: AppServer, input: CallRecordInput) => {
  if (mongoose.connection.readyState !== 1) return
  try {
    const result = await mongoose.connection.transaction(async (session) => {
      const conversation = await Conversation.findById(input.conversationId).session(session)
      if (!conversation) return null

      const message = new Message({
        conversationId: conversation._id,
        senderId: new Types.ObjectId(input.callerId),
        type: 'call',
        call: {
          callId: input.callId,
          callType: 'video',
          status: input.status,
          duration: input.duration
        }
      })
      await message.save({ session })
      updateConversationAfterCreateMessage(conversation, message, message.senderId)
      await conversation.save({ session })
      return { conversation, message: message as MessageDocument }
    })

    if (result) emitNewMessage(io, result.conversation, result.message)
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return
    console.error('Unable to persist call record', error)
  }
}
