import mongoose from 'mongoose'
import Conversation from '@/models/Conversation.js'
import type {
  AppServer,
  AppSocket,
  CallAnswerPayload,
  CallIcePayload,
  CallInvitePayload,
  CallOfferPayload,
  CallPayload,
  CallRejectPayload
} from '@/types/socket.types.js'

const INVITE_RATE_LIMIT = 5
const INVITE_RATE_WINDOW_MS = 15000
const RING_TIMEOUT_MS = 45000
const MAX_SDP_LENGTH = 200000
const MAX_CANDIDATE_LENGTH = 10000
const MAX_PENDING_CANDIDATES = 32
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CallSession extends CallPayload {
  status: 'ringing' | 'accepted'
  offerSent: boolean
  answerSent: boolean
  callerSocketId: string
  receiverSocketId?: string
  pendingCallerCandidates: unknown[]
  ringTimeout: ReturnType<typeof setTimeout>
}

const callsById = new Map<string, CallSession>()
const activeCallsByUser = new Map<string, string>()
const callsBySocket = new Map<string, string>()

const isValidCallPayload = (payload: unknown): payload is CallPayload => {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as Record<string, unknown>
  return (
    typeof p.callId === 'string' &&
    UUID_PATTERN.test(p.callId) &&
    typeof p.conversationId === 'string' &&
    mongoose.isValidObjectId(p.conversationId) &&
    typeof p.callerId === 'string' &&
    mongoose.isValidObjectId(p.callerId) &&
    typeof p.receiverId === 'string' &&
    mongoose.isValidObjectId(p.receiverId) &&
    p.callerId !== p.receiverId
  )
}

const isValidSdp = (value: unknown, expectedType: 'offer' | 'answer') => {
  if (typeof value !== 'object' || value === null) return false
  const sdp = value as Record<string, unknown>
  return (
    sdp.type === expectedType &&
    typeof sdp.sdp === 'string' &&
    sdp.sdp.length > 0 &&
    sdp.sdp.length <= MAX_SDP_LENGTH
  )
}

const isValidCandidate = (value: unknown) => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.candidate === 'string' &&
    candidate.candidate.length <= MAX_CANDIDATE_LENGTH &&
    (candidate.sdpMid === undefined ||
      candidate.sdpMid === null ||
      typeof candidate.sdpMid === 'string') &&
    (candidate.sdpMLineIndex === undefined ||
      candidate.sdpMLineIndex === null ||
      typeof candidate.sdpMLineIndex === 'number')
  )
}

const isDirectCallBetween = async (
  conversationId: string,
  callerId: string,
  receiverId: string
) => {
  const conversation = await Conversation.findById(conversationId).lean()
  if (!conversation || conversation.type !== 'direct') return false
  const memberIds = conversation.participants.map((participant) => participant.userId.toString())
  return memberIds.length === 2 && memberIds.includes(callerId) && memberIds.includes(receiverId)
}

const sessionPayload = (session: CallSession): CallPayload => ({
  callId: session.callId,
  conversationId: session.conversationId,
  callerId: session.callerId,
  receiverId: session.receiverId
})

const matchesSession = (payload: CallPayload, session: CallSession) =>
  payload.callId === session.callId &&
  payload.conversationId === session.conversationId &&
  payload.callerId === session.callerId &&
  payload.receiverId === session.receiverId

const releaseSession = (session: CallSession) => {
  clearTimeout(session.ringTimeout)
  callsById.delete(session.callId)
  if (activeCallsByUser.get(session.callerId) === session.callId) {
    activeCallsByUser.delete(session.callerId)
  }
  if (activeCallsByUser.get(session.receiverId) === session.callId) {
    activeCallsByUser.delete(session.receiverId)
  }
  if (callsBySocket.get(session.callerSocketId) === session.callId) {
    callsBySocket.delete(session.callerSocketId)
  }
  if (session.receiverSocketId && callsBySocket.get(session.receiverSocketId) === session.callId) {
    callsBySocket.delete(session.receiverSocketId)
  }
}

const emitCallEnd = (io: AppServer, session: CallSession) => {
  io.to([`user:${session.callerId}`, `user:${session.receiverId}`]).emit(
    'call:end',
    sessionPayload(session)
  )
}

const endSession = (io: AppServer, session: CallSession) => {
  releaseSession(session)
  emitCallEnd(io, session)
}

const getSession = (payload: unknown) => {
  if (!isValidCallPayload(payload)) return null
  const session = callsById.get(payload.callId)
  return session && matchesSession(payload, session) ? session : null
}

const isSessionSocket = (socket: AppSocket, session: CallSession) =>
  socket.id === session.callerSocketId || socket.id === session.receiverSocketId

const peerSocketId = (socket: AppSocket, session: CallSession) =>
  socket.id === session.callerSocketId ? session.receiverSocketId : session.callerSocketId

const tryReserveUsers = (callerId: string, receiverId: string, callId: string) => {
  if (
    callsById.has(callId) ||
    activeCallsByUser.has(callerId) ||
    activeCallsByUser.has(receiverId)
  ) {
    return false
  }
  activeCallsByUser.set(callerId, callId)
  activeCallsByUser.set(receiverId, callId)
  return true
}

const unreserveUsers = (callerId: string, receiverId: string, callId: string) => {
  if (activeCallsByUser.get(callerId) === callId) activeCallsByUser.delete(callerId)
  if (activeCallsByUser.get(receiverId) === callId) activeCallsByUser.delete(receiverId)
}

export const registerCallHandlers = (
  io: AppServer,
  socket: AppSocket,
  isUserOnline: (userId: string) => boolean
) => {
  const user = socket.data.user
  const userId = user._id.toString()
  const inviteTimestamps: number[] = []

  socket.on('call:invite', async (payload: CallInvitePayload) => {
    if (!isValidCallPayload(payload) || payload.callerId !== userId) return

    const now = Date.now()
    while (inviteTimestamps.length > 0 && now - inviteTimestamps[0]! > INVITE_RATE_WINDOW_MS) {
      inviteTimestamps.shift()
    }
    if (inviteTimestamps.length >= INVITE_RATE_LIMIT) return
    inviteTimestamps.push(now)

    if (!tryReserveUsers(payload.callerId, payload.receiverId, payload.callId)) {
      socket.emit('call:busy', payload)
      return
    }

    try {
      const allowed = await isDirectCallBetween(
        payload.conversationId,
        payload.callerId,
        payload.receiverId
      )
      if (!allowed) {
        unreserveUsers(payload.callerId, payload.receiverId, payload.callId)
        return
      }

      if (!isUserOnline(payload.receiverId)) {
        unreserveUsers(payload.callerId, payload.receiverId, payload.callId)
        socket.emit('call:unavailable', payload)
        return
      }

      if (callsById.has(payload.callId)) {
        unreserveUsers(payload.callerId, payload.receiverId, payload.callId)
        socket.emit('call:busy', payload)
        return
      }

      const session: CallSession = {
        callId: payload.callId,
        conversationId: payload.conversationId,
        callerId: payload.callerId,
        receiverId: payload.receiverId,
        status: 'ringing',
        offerSent: false,
        answerSent: false,
        callerSocketId: socket.id,
        pendingCallerCandidates: [],
        ringTimeout: setTimeout(() => {
          const current = callsById.get(payload.callId)
          if (current?.status === 'ringing') endSession(io, current)
        }, RING_TIMEOUT_MS)
      }

      callsById.set(session.callId, session)
      callsBySocket.set(socket.id, session.callId)

      io.to(`user:${session.receiverId}`).emit('call:invite', {
        ...sessionPayload(session),
        caller: {
          _id: userId,
          displayName: user.displayName,
          ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {})
        }
      })
    } catch (error) {
      unreserveUsers(payload.callerId, payload.receiverId, payload.callId)
      console.error('Unable to create call session', error)
      socket.emit('call:unavailable', payload)
    }
  })

  socket.on('call:accept', (payload: CallPayload) => {
    const session = getSession(payload)
    if (!session || session.status !== 'ringing' || userId !== session.receiverId) return

    clearTimeout(session.ringTimeout)
    session.status = 'accepted'
    session.receiverSocketId = socket.id
    callsBySocket.set(socket.id, session.callId)

    io.to(session.callerSocketId).emit('call:accept', sessionPayload(session))
    for (const candidate of session.pendingCallerCandidates) {
      io.to(session.receiverSocketId).emit('call:ice-candidate', {
        ...sessionPayload(session),
        candidate
      })
    }
    session.pendingCallerCandidates = []
    socket.to(`user:${session.receiverId}`).emit('call:handled', { callId: session.callId })
  })

  socket.on('call:reject', (payload: CallRejectPayload) => {
    const session = getSession(payload)
    if (!session || session.status !== 'ringing' || userId !== session.receiverId) return

    releaseSession(session)
    io.to(session.callerSocketId).emit('call:reject', {
      ...sessionPayload(session),
      ...(payload.reason ? { reason: payload.reason } : {})
    })
    io.to(`user:${session.receiverId}`).emit('call:handled', { callId: session.callId })
  })

  socket.on('call:offer', (payload: CallOfferPayload) => {
    const session = getSession(payload)
    if (
      !session ||
      session.status !== 'accepted' ||
      socket.id !== session.callerSocketId ||
      !session.receiverSocketId ||
      session.offerSent ||
      !isValidSdp(payload.sdp, 'offer')
    ) {
      return
    }
    session.offerSent = true
    io.to(session.receiverSocketId).emit('call:offer', {
      ...sessionPayload(session),
      sdp: payload.sdp
    })
  })

  socket.on('call:answer', (payload: CallAnswerPayload) => {
    const session = getSession(payload)
    if (
      !session ||
      session.status !== 'accepted' ||
      socket.id !== session.receiverSocketId ||
      !session.offerSent ||
      session.answerSent ||
      !isValidSdp(payload.sdp, 'answer')
    ) {
      return
    }
    session.answerSent = true
    io.to(session.callerSocketId).emit('call:answer', {
      ...sessionPayload(session),
      sdp: payload.sdp
    })
  })

  socket.on('call:ice-candidate', (payload: CallIcePayload) => {
    const session = getSession(payload)
    if (!session || !isValidCandidate(payload.candidate)) {
      return
    }
    if (session.status === 'ringing') {
      if (socket.id !== session.callerSocketId) return
      if (session.pendingCallerCandidates.length >= MAX_PENDING_CANDIDATES) {
        session.pendingCallerCandidates.shift()
      }
      session.pendingCallerCandidates.push(payload.candidate)
      return
    }
    if (session.status !== 'accepted' || !isSessionSocket(socket, session)) return
    const targetSocketId = peerSocketId(socket, session)
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ice-candidate', {
        ...sessionPayload(session),
        candidate: payload.candidate
      })
    }
  })

  socket.on('call:busy', (payload: CallPayload) => {
    const session = getSession(payload)
    if (!session || session.status !== 'ringing' || userId !== session.receiverId) return

    releaseSession(session)
    io.to(session.callerSocketId).emit('call:busy', sessionPayload(session))
    io.to(`user:${session.receiverId}`).emit('call:handled', { callId: session.callId })
  })

  socket.on('call:end', (payload: CallPayload) => {
    const session = getSession(payload)
    if (!session || !isSessionSocket(socket, session)) return
    endSession(io, session)
  })
}

export const handleCallSocketDisconnect = (
  io: AppServer,
  socket: AppSocket,
  isUserOnline: (userId: string) => boolean
) => {
  const ownedCallId = callsBySocket.get(socket.id)
  const ownedSession = ownedCallId ? callsById.get(ownedCallId) : undefined
  if (ownedSession) {
    endSession(io, ownedSession)
    return
  }

  const userId = socket.data.user._id.toString()
  const userCallId = activeCallsByUser.get(userId)
  const session = userCallId ? callsById.get(userCallId) : undefined
  if (session?.status === 'ringing' && session.receiverId === userId && !isUserOnline(userId)) {
    endSession(io, session)
  }
}
