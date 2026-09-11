import assert from 'node:assert/strict'
import test from 'node:test'
import Conversation from '../src/models/Conversation.js'
import { registerCallHandlers } from '../src/socket/callHandlers.js'

type Handler = (payload: unknown) => unknown

const callerId = '64b000000000000000000001'
const receiverId = '64b000000000000000000002'
const secondCallerId = '64b000000000000000000003'
const conversationId = '64b000000000000000000011'
const secondConversationId = '64b000000000000000000012'

const createSocket = (id: string, userId: string) => {
  const handlers = new Map<string, Handler>()
  const emitted: Array<{ event: string; payload: unknown }> = []
  const roomEmitted: Array<{ room: string; event: string; payload: unknown }> = []
  return {
    id,
    data: {
      user: {
        _id: { toString: () => userId },
        displayName: userId
      }
    },
    handlers,
    emitted,
    roomEmitted,
    on: (event: string, handler: Handler) => handlers.set(event, handler),
    emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
    to: (room: string) => ({
      emit: (event: string, payload: unknown) => roomEmitted.push({ room, event, payload })
    })
  }
}

const createIo = () => {
  const emitted: Array<{ target: string | string[]; event: string; payload: unknown }> = []
  return {
    emitted,
    to: (target: string | string[]) => ({
      emit: (event: string, payload: unknown) => emitted.push({ target, event, payload })
    })
  }
}

const invoke = async (socket: ReturnType<typeof createSocket>, event: string, payload: unknown) => {
  const handler = socket.handlers.get(event)
  assert.ok(handler, `Missing handler for ${event}`)
  await handler(payload)
}

test('ignores malformed call invitations without querying MongoDB', async () => {
  const socket = createSocket('caller-socket-invalid', callerId)
  const io = createIo()
  registerCallHandlers(io as never, socket as never, () => true)

  await invoke(socket, 'call:invite', {
    callId: 'not-a-uuid',
    conversationId: 'not-an-object-id',
    callerId,
    receiverId
  })

  assert.equal(io.emitted.length, 0)
  assert.equal(socket.emitted.length, 0)
})

test('binds signaling to the accepted browser tab and marks the user busy', async () => {
  const originalFindById = Conversation.findById
  Conversation.findById = ((id: string) => ({
    lean: async () => ({
      type: 'direct',
      participants: [
        { userId: { toString: () => (id === secondConversationId ? secondCallerId : callerId) } },
        { userId: { toString: () => receiverId } }
      ]
    })
  })) as typeof Conversation.findById

  try {
    const io = createIo()
    const caller = createSocket('caller-socket', callerId)
    const secondCaller = createSocket('second-caller-socket', secondCallerId)
    const receiverTab = createSocket('receiver-tab', receiverId)
    const otherReceiverTab = createSocket('receiver-other-tab', receiverId)

    registerCallHandlers(io as never, caller as never, () => true)
    registerCallHandlers(io as never, secondCaller as never, () => true)
    registerCallHandlers(io as never, receiverTab as never, () => true)
    registerCallHandlers(io as never, otherReceiverTab as never, () => true)

    const call = {
      callId: '11111111-1111-4111-8111-111111111111',
      conversationId,
      callerId,
      receiverId
    }
    await invoke(caller, 'call:invite', call)

    await invoke(secondCaller, 'call:invite', {
      callId: '22222222-2222-4222-8222-222222222222',
      conversationId: secondConversationId,
      callerId: secondCallerId,
      receiverId
    })
    assert.equal(secondCaller.emitted.at(-1)?.event, 'call:busy')

    await invoke(receiverTab, 'call:accept', call)
    const beforeInvalidAnswer = io.emitted.length
    await invoke(otherReceiverTab, 'call:answer', {
      ...call,
      sdp: { type: 'answer', sdp: 'invalid sender' }
    })
    assert.equal(io.emitted.length, beforeInvalidAnswer)

    await invoke(caller, 'call:offer', {
      ...call,
      sdp: { type: 'offer', sdp: 'valid offer' }
    })
    assert.equal(io.emitted.at(-1)?.target, receiverTab.id)
    assert.equal(io.emitted.at(-1)?.event, 'call:offer')

    await invoke(receiverTab, 'call:answer', {
      ...call,
      sdp: { type: 'answer', sdp: 'valid answer' }
    })
    assert.equal(io.emitted.at(-1)?.target, caller.id)
    assert.equal(io.emitted.at(-1)?.event, 'call:answer')

    await invoke(caller, 'call:end', call)
  } finally {
    Conversation.findById = originalFindById
  }
})

test('reserves users before Mongo so overlapping invites emit busy', async () => {
  let releaseFind: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    releaseFind = resolve
  })
  const originalFindById = Conversation.findById
  Conversation.findById = (() => ({
    lean: async () => {
      await gate
      return {
        type: 'direct',
        participants: [
          { userId: { toString: () => callerId } },
          { userId: { toString: () => receiverId } }
        ]
      }
    }
  })) as typeof Conversation.findById

  try {
    const io = createIo()
    const caller = createSocket('caller-overlap', callerId)
    const secondCaller = createSocket('second-overlap', secondCallerId)
    registerCallHandlers(io as never, caller as never, () => true)
    registerCallHandlers(io as never, secondCaller as never, () => true)

    const first = invoke(caller, 'call:invite', {
      callId: '33333333-3333-4333-8333-333333333333',
      conversationId,
      callerId,
      receiverId
    })
    const second = invoke(secondCaller, 'call:invite', {
      callId: '44444444-4444-4444-8444-444444444444',
      conversationId: secondConversationId,
      callerId: secondCallerId,
      receiverId
    })
    assert.equal(secondCaller.emitted.at(-1)?.event, 'call:busy')
    releaseFind?.()
    await Promise.all([first, second])
    await invoke(caller, 'call:end', {
      callId: '33333333-3333-4333-8333-333333333333',
      conversationId,
      callerId,
      receiverId
    })
  } finally {
    Conversation.findById = originalFindById
  }
})

test('caps queued ICE candidates while the call is ringing', async () => {
  const originalFindById = Conversation.findById
  Conversation.findById = (() => ({
    lean: async () => ({
      type: 'direct',
      participants: [
        { userId: { toString: () => callerId } },
        { userId: { toString: () => receiverId } }
      ]
    })
  })) as typeof Conversation.findById

  try {
    const io = createIo()
    const caller = createSocket('ice-caller', callerId)
    const receiver = createSocket('ice-receiver', receiverId)
    registerCallHandlers(io as never, caller as never, () => true)
    registerCallHandlers(io as never, receiver as never, () => true)

    const call = {
      callId: '55555555-5555-4555-8555-555555555555',
      conversationId,
      callerId,
      receiverId
    }
    await invoke(caller, 'call:invite', call)

    for (let i = 0; i < 40; i += 1) {
      await invoke(caller, 'call:ice-candidate', {
        ...call,
        candidate: { candidate: `cand-${i}`, sdpMid: '0', sdpMLineIndex: 0 }
      })
    }

    const beforeAccept = io.emitted.length
    await invoke(receiver, 'call:accept', call)
    const iceForwards = io.emitted
      .slice(beforeAccept)
      .filter((item) => item.event === 'call:ice-candidate')
    assert.equal(iceForwards.length, 32)
    assert.equal(
      (iceForwards[0]?.payload as { candidate: { candidate: string } }).candidate.candidate,
      'cand-8'
    )
    await invoke(caller, 'call:end', call)
  } finally {
    Conversation.findById = originalFindById
  }
})
