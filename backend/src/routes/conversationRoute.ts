import {
  addGroupMembers,
  createConversation,
  getConversation,
  getMessages,
  leaveGroup,
  markConversationRead,
  removeGroupMember,
  updateGroup
} from '@/controllers/conversationController.js'
import {
  addGroupMembersValidator,
  createConversationValidator,
  getMessagesValidator,
  leaveGroupValidator,
  removeGroupMemberValidator,
  updateGroupValidator
} from '@/middlewares/conversationMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'
import type {
  GetMessagesParams,
  GetMessagesQuery,
  RemoveMemberParams
} from '@/types/conversation.types.js'

const conversationRouter = express.Router()

conversationRouter.post('/', createConversationValidator, asyncHandler(createConversation))

conversationRouter.get('/', asyncHandler(getConversation))

conversationRouter.get<GetMessagesParams, unknown, unknown, GetMessagesQuery>(
  '/:conversationId/messages',
  getMessagesValidator,
  asyncHandler(getMessages)
)

conversationRouter.patch<GetMessagesParams>(
  '/:conversationId/read',
  getMessagesValidator,
  asyncHandler(markConversationRead)
)

conversationRouter.post<GetMessagesParams>(
  '/:conversationId/members',
  addGroupMembersValidator,
  asyncHandler(addGroupMembers)
)

conversationRouter.delete<RemoveMemberParams>(
  '/:conversationId/members/:memberId',
  removeGroupMemberValidator,
  asyncHandler(removeGroupMember)
)

conversationRouter.post<GetMessagesParams>(
  '/:conversationId/leave',
  leaveGroupValidator,
  asyncHandler(leaveGroup)
)

conversationRouter.patch<GetMessagesParams>(
  '/:conversationId',
  updateGroupValidator,
  asyncHandler(updateGroup)
)

export default conversationRouter
