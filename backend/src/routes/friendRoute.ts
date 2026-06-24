import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendRequests
} from '@/controllers/friendController.js'
import {
  friendRequestIdValidator,
  sendFriendRequestValidator
} from '@/middlewares/friendMiddleware.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import express from 'express'

const friendRouter = express.Router()

friendRouter.post('/requests', sendFriendRequestValidator, asyncHandler(sendFriendRequest))

friendRouter.post(
  '/requests/:requestId/accept',
  friendRequestIdValidator,
  asyncHandler(acceptFriendRequest)
)

friendRouter.post(
  '/requests/:requestId/decline',
  friendRequestIdValidator,
  asyncHandler(declineFriendRequest)
)

friendRouter.get('/', asyncHandler(getAllFriends))

friendRouter.get('/requests', asyncHandler(getFriendRequests))

export default friendRouter
