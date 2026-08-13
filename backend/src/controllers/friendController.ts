import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES, FRIEND_MESSAGES, USER_MESSAGES } from '@/constants/messages.js'
import Friend from '@/models/Friend.js'
import FriendRequest from '@/models/FriendRequest.js'
import User from '@/models/User.js'
import { AppError } from '@/utils/AppError.js'
import type { EmptyRequest, TypedRequest, TypedResponse } from '@/types/api.types.js'
import type { FriendRequestIdParams, SendFriendRequestBody } from '@/types/friend.types.js'
export const sendFriendRequest = async (
  req: TypedRequest<SendFriendRequestBody>,
  res: TypedResponse
) => {
  const { to, message } = req.body

  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const from = req.user._id

  const userExists = await User.exists({ _id: to })

  if (!userExists) {
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  let userA = from.toString()
  let userB = to.toString()

  if (userA > userB) {
    ;[userA, userB] = [userB, userA]
  }
  const [alreadyFriends, existingRequest] = await Promise.all([
    Friend.findOne({ userA, userB }),
    FriendRequest.exists({
      $or: [
        { from, to },
        { from: to, to: from }
      ]
    })
  ])
  if (alreadyFriends) {
    throw new AppError(FRIEND_MESSAGES.ALREADY_FRIENDS, HTTP_STATUS.CONFLICT)
  }

  if (existingRequest) {
    throw new AppError(FRIEND_MESSAGES.FRIEND_REQUEST_SENT_ALREADY, HTTP_STATUS.CONFLICT)
  }

  const request = await FriendRequest.create({
    from,
    to,
    ...(message !== undefined ? { message } : {})
  })

  return res.status(HTTP_STATUS.CREATED).json({
    message: FRIEND_MESSAGES.FRIEND_REQUEST_SENT,
    friendRequest: request
  })
}

export const acceptFriendRequest = async (
  req: TypedRequest<unknown, FriendRequestIdParams>,
  res: TypedResponse
) => {
  const { requestId } = req.params
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const userId = req.user._id

  const request = await FriendRequest.findById(requestId)

  if (!request) {
    throw new AppError(FRIEND_MESSAGES.FRIEND_REQUEST_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (request.to.toString() !== userId.toString()) {
    throw new AppError(FRIEND_MESSAGES.FORBIDDEN_ACCEPT_FRIEND_REQUEST, HTTP_STATUS.FORBIDDEN)
  }

  await Friend.create({
    userA: request.from,
    userB: request.to
  })

  await FriendRequest.findByIdAndDelete(requestId)

  const from = await User.findById(request.from).select('_id displayName avatarUrl').lean()

  return res.status(HTTP_STATUS.OK).json({
    message: FRIEND_MESSAGES.FRIEND_REQUEST_ACCEPTED,
    newFriend: {
      _id: from?._id,
      displayName: from?.displayName,
      avatarUrl: from?.avatarUrl
    }
  })
}

export const declineFriendRequest = async (
  req: TypedRequest<unknown, FriendRequestIdParams>,
  res: TypedResponse
) => {
  const { requestId } = req.params
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const userId = req.user._id

  const request = await FriendRequest.findById(requestId)

  if (!request) {
    throw new AppError(FRIEND_MESSAGES.FRIEND_REQUEST_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (request.to.toString() !== userId.toString()) {
    throw new AppError(FRIEND_MESSAGES.FORBIDDEN_DECLINE_FRIEND_REQUEST, HTTP_STATUS.FORBIDDEN)
  }

  await FriendRequest.findByIdAndDelete(requestId)

  return res.status(HTTP_STATUS.NO_CONTENT).send()
}

export const getAllFriends = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const userId = req.user._id
  const friendships = await Friend.find({
    $or: [{ userA: userId }, { userB: userId }]
  })
    .populate('userA', '_id displayName avatarUrl')
    .populate('userB', '_id displayName avatarUrl')
    .lean()

  if (friendships.length === 0) {
    return res.status(HTTP_STATUS.OK).json({
      friends: []
    })
  }

  const friends = friendships.map((f) =>
    f.userA._id.toString() === userId.toString() ? f.userB : f.userA
  )

  return res.status(HTTP_STATUS.OK).json({
    friends
  })
}

export const getFriendRequests = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  const populateFields = '_id username displayName avatarUrl'
  const userId = req.user._id
  const [sent, received] = await Promise.all([
    FriendRequest.find({ from: userId }).populate('to', populateFields),
    FriendRequest.find({ to: userId }).populate('from', populateFields)
  ])
  return res.status(HTTP_STATUS.OK).json({
    sent,
    received
  })
}
