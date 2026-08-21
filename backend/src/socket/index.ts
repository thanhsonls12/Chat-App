import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import { socketAuthMiddleware } from '@/middlewares/socketMiddleware.js'
import type {
  AppServer,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@/types/socket.types.js'
import { envConfig } from '@/config/env.js'
import { getUserConversationsForSocketIO } from '@/controllers/conversationController.js'

const app = express()

const server = http.createServer(app)

const io: AppServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: envConfig.CLIENT_URL,
    credentials: true
  }
})

io.use(socketAuthMiddleware)

const onlineUsers = new Map<string, Set<string>>()

io.on('connection', async (socket) => {
  const user = socket.data.user
  const userId = user._id.toString()
  console.log(`${user.displayName} online with: ${socket.id}`)

  socket.join(`user:${userId}`)

  const userSockets = onlineUsers.get(userId) ?? new Set<string>()
  userSockets.add(socket.id)
  onlineUsers.set(userId, userSockets)

  io.emit('onlineUsers', Array.from(onlineUsers.keys()))

  socket.on('join-conversation', async (conversationId) => {
    if (typeof conversationId !== 'string') return

    try {
      const conversationIds = await getUserConversationsForSocketIO(userId)
      if (conversationIds.includes(conversationId)) {
        await socket.join(conversationId)
      }
    } catch (error) {
      console.error('Unable to join newly created conversation room', error)
    }
  })

  const lastTypingEmitAt = new Map<string, number>()
  const TYPING_THROTTLE_MS = 2000

  const emitTyping = (conversationId: unknown, isTyping: boolean) => {
    if (typeof conversationId !== 'string') return
    if (!socket.rooms.has(conversationId)) return

    const userId = socket.data.user._id.toString()
    const now = Date.now()

    if (!isTyping) {
      lastTypingEmitAt.delete(conversationId)
    } else {
      const lastEmit = lastTypingEmitAt.get(conversationId) ?? 0
      if (now - lastEmit < TYPING_THROTTLE_MS) return
      lastTypingEmitAt.set(conversationId, now)
    }

    socket.to(conversationId).emit('user-typing', {
      conversationId,
      userId,
      displayName: user.displayName,
      isTyping
    })
  }

  socket.on('typing', (conversationId) => emitTyping(conversationId, true))
  socket.on('stop-typing', (conversationId) => emitTyping(conversationId, false))

  socket.on('leave-conversation', async (conversationId) => {
    if (typeof conversationId !== 'string') return
    await socket.leave(conversationId)
  })

  socket.on('disconnect', () => {
    const remainingSockets = onlineUsers.get(userId)
    remainingSockets?.delete(socket.id)
    if (!remainingSockets?.size) {
      onlineUsers.delete(userId)
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()))
    console.log(`socket disconnected: ${socket.id}`)
  })

  try {
    const conversationIds = await getUserConversationsForSocketIO(userId)
    await socket.join(conversationIds)
  } catch (error) {
    console.error('Unable to join conversation rooms', error)
    socket.disconnect(true)
  }
})

export { io, app, server }
