import Conversation from '@/models/Conversation.js'
import type { Types } from 'mongoose'

type UserId = string | Types.ObjectId

export const getDirectConversationKey = (firstUserId: UserId, secondUserId: UserId) =>
  [firstUserId.toString(), secondUserId.toString()].sort().join(':')

export const findOrCreateDirectConversation = async (
  firstUserId: UserId,
  secondUserId: UserId
) => {
  const directKey = getDirectConversationKey(firstUserId, secondUserId)

  const keyedConversation = await Conversation.findOne({ directKey })
  if (keyedConversation) return keyedConversation

  const legacyConversation = await Conversation.findOne({
    type: 'direct',
    participants: { $size: 2 },
    'participants.userId': { $all: [firstUserId, secondUserId] }
  })

  if (legacyConversation) {
    legacyConversation.directKey = directKey
    try {
      await legacyConversation.save()
      return legacyConversation
    } catch (error: unknown) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) {
        throw error
      }
      const concurrentConversation = await Conversation.findOne({ directKey })
      if (concurrentConversation) return concurrentConversation
      throw error
    }
  }

  try {
    return await Conversation.findOneAndUpdate(
      { directKey },
      {
        $setOnInsert: {
          type: 'direct',
          directKey,
          participants: [{ userId: firstUserId }, { userId: secondUserId }]
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  } catch (error: unknown) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) {
      throw error
    }
    const concurrentConversation = await Conversation.findOne({ directKey })
    if (concurrentConversation) return concurrentConversation
    throw error
  }
}
