import { create } from 'zustand'
import { toast } from 'sonner'
import type { CallState } from '@/types/store'
import type { Conversation } from '@/types/chat'
import {
  createPeerConnection,
  getLocalMediaStream,
  stopStream,
} from '@/lib/webrtc'
import { useAuthStore } from './useAuthStore'
import { useSocketStore } from './useSocketStore'
import { t } from '@/i18n'

const RING_TIMEOUT_MS = 40000
const CONNECT_TIMEOUT_MS = 25000
const DISCONNECT_GRACE_MS = 10000
const TERMINAL_STATUS_MS = 1500

let ringTimeout: ReturnType<typeof setTimeout> | null = null
let connectTimeout: ReturnType<typeof setTimeout> | null = null
let disconnectTimeout: ReturnType<typeof setTimeout> | null = null
let terminalTimeout: ReturnType<typeof setTimeout> | null = null
let pendingCandidates: RTCIceCandidateInit[] = []
let mediaRequestVersion = 0

const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
  if (timer) clearTimeout(timer)
}

const clearAllTimers = () => {
  clearTimer(ringTimeout)
  clearTimer(connectTimeout)
  clearTimer(disconnectTimeout)
  clearTimer(terminalTimeout)
  ringTimeout = null
  connectTimeout = null
  disconnectTimeout = null
  terminalTimeout = null
}

const idleState = {
  status: 'idle' as const,
  callId: null,
  conversationId: null,
  peer: null,
  isCaller: false,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  micEnabled: true,
  startedAt: null,
}

const emit = (event: string, payload: unknown) => {
  useSocketStore.getState().socket?.emit(event, payload)
}

export const useCallStore = create<CallState>((set, get) => {
  const buildPayload = () => {
    const { callId, conversationId, isCaller, peer } = get()
    const me = useAuthStore.getState().user
    if (!callId || !conversationId || !peer || !me) return null
    return {
      callId,
      conversationId,
      callerId: isCaller ? me._id : peer._id,
      receiverId: isCaller ? peer._id : me._id,
    }
  }

  const cleanup = () => {
    mediaRequestVersion += 1
    clearAllTimers()
    pendingCandidates = []
    const { localStream, remoteStream, peerConnection } = get()
    stopStream(localStream)
    stopStream(remoteStream)
    if (peerConnection) {
      peerConnection.onicecandidate = null
      peerConnection.ontrack = null
      peerConnection.onconnectionstatechange = null
      peerConnection.close()
    }
  }

  const resetToIdle = () => {
    cleanup()
    set(idleState)
  }

  const teardown = (finalStatus: 'ended' | 'failed') => {
    const { callId, conversationId, peer, isCaller } = get()
    cleanup()
    set({
      ...idleState,
      status: finalStatus,
      callId,
      conversationId,
      peer,
      isCaller,
    })
    terminalTimeout = setTimeout(() => {
      const current = get()
      if (current.callId === callId && current.status === finalStatus)
        set(idleState)
    }, TERMINAL_STATUS_MS)
  }

  const failActiveCall = (message: string) => {
    const payload = buildPayload()
    if (payload) emit('call:end', payload)
    toast.error(message)
    teardown('failed')
  }

  const startConnectTimeout = () => {
    clearTimer(connectTimeout)
    const expectedCallId = get().callId
    connectTimeout = setTimeout(() => {
      const current = get()
      if (
        current.callId === expectedCallId &&
        current.status === 'connecting'
      ) {
        failActiveCall(t('connectTimeout'))
      }
    }, CONNECT_TIMEOUT_MS)
  }

  const flushCandidates = async (pc: RTCPeerConnection) => {
    const candidates = pendingCandidates
    pendingCandidates = []
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(candidate)
      } catch (error) {
        console.error('Unable to add queued ICE candidate', error)
      }
    }
  }

  const setupPeerConnection = (pc: RTCPeerConnection) => {
    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      const payload = buildPayload()
      if (payload) {
        emit('call:ice-candidate', {
          ...payload,
          candidate: event.candidate.toJSON(),
        })
      }
    }
    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) set({ remoteStream: stream })
    }
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'connected') {
        clearTimer(connectTimeout)
        clearTimer(disconnectTimeout)
        connectTimeout = null
        disconnectTimeout = null
        if (get().status !== 'connected') {
          set({ status: 'connected', startedAt: get().startedAt ?? Date.now() })
        }
      } else if (state === 'failed') {
        failActiveCall(t('connectionLost'))
      } else if (state === 'disconnected') {
        clearTimer(disconnectTimeout)
        disconnectTimeout = setTimeout(() => {
          const later = pc.connectionState
          if (later === 'disconnected' || later === 'failed') {
            failActiveCall(t('connectionLostLong'))
          }
        }, DISCONNECT_GRACE_MS)
      }
    }
  }

  return {
    ...idleState,
    startCall: async (conversation: Conversation) => {
      const status = get().status
      if (
        (status !== 'idle' && status !== 'failed' && status !== 'ended') ||
        conversation.type !== 'direct'
      ) {
        return
      }
      const me = useAuthStore.getState().user
      if (!me) return
      const receiver = conversation.participants.find(
        (participant) => participant._id !== me._id
      )
      if (!receiver) return

      const callId = crypto.randomUUID()
      const requestVersion = ++mediaRequestVersion
      set({
        ...idleState,
        status: 'preparing',
        callId,
        conversationId: conversation._id,
        peer: {
          _id: receiver._id,
          displayName: receiver.displayName,
          avatarUrl: receiver.avatarUrl,
        },
        isCaller: true,
      })

      let localStream: MediaStream
      try {
        localStream = await getLocalMediaStream()
      } catch {
        if (get().callId === callId) {
          toast.error(t('mediaUnavailable'))
          teardown('failed')
        }
        return
      }

      if (
        mediaRequestVersion !== requestVersion ||
        get().callId !== callId ||
        get().status !== 'preparing'
      ) {
        stopStream(localStream)
        return
      }

      const pc = createPeerConnection()
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream))
      setupPeerConnection(pc)
      set({
        status: 'outgoing',
        localStream,
        peerConnection: pc,
        micEnabled: true,
      })

      const payload = buildPayload()
      if (!payload) {
        resetToIdle()
        return
      }
      emit('call:invite', payload)

      ringTimeout = setTimeout(() => {
        if (get().callId === callId && get().status === 'outgoing') {
          const currentPayload = buildPayload()
          if (currentPayload) emit('call:end', currentPayload)
          toast.error(t('noResponse'))
          teardown('ended')
        }
      }, RING_TIMEOUT_MS)
    },
    acceptCall: async () => {
      if (get().status !== 'incoming') return
      clearTimer(ringTimeout)
      ringTimeout = null
      const callId = get().callId
      const requestVersion = ++mediaRequestVersion
      set({ status: 'preparing' })

      let localStream: MediaStream
      try {
        localStream = await getLocalMediaStream()
      } catch {
        if (get().callId === callId) {
          const payload = buildPayload()
          if (payload)
            emit('call:reject', { ...payload, reason: 'media-unavailable' })
          toast.error(t('mediaUnavailable'))
          teardown('failed')
        }
        return
      }

      if (
        mediaRequestVersion !== requestVersion ||
        get().callId !== callId ||
        get().status !== 'preparing'
      ) {
        stopStream(localStream)
        return
      }

      const pc = createPeerConnection()
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream))
      setupPeerConnection(pc)
      set({
        status: 'connecting',
        localStream,
        peerConnection: pc,
        micEnabled: true,
      })

      const payload = buildPayload()
      if (payload) {
        emit('call:accept', payload)
        startConnectTimeout()
      } else {
        resetToIdle()
      }
    },
    rejectCall: () => {
      const payload = buildPayload()
      if (payload) emit('call:reject', payload)
      resetToIdle()
    },
    endCall: () => {
      const payload = buildPayload()
      if (payload) emit('call:end', payload)
      teardown('ended')
    },
    toggleMic: () => {
      const { localStream, micEnabled } = get()
      const next = !micEnabled
      localStream?.getAudioTracks().forEach((track) => (track.enabled = next))
      set({ micEnabled: next })
    },
    resetCall: resetToIdle,
    handleSocketDisconnect: () => {
      if (get().status === 'idle') return
      const payload = buildPayload()
      if (payload) emit('call:end', payload)
      teardown('failed')
    },
    handleInvite: (payload) => {
      if (get().status !== 'idle') {
        emit('call:busy', {
          callId: payload.callId,
          conversationId: payload.conversationId,
          callerId: payload.callerId,
          receiverId: payload.receiverId,
        })
        return
      }
      set({
        ...idleState,
        status: 'incoming',
        callId: payload.callId,
        conversationId: payload.conversationId,
        peer: payload.caller,
        isCaller: false,
      })
      ringTimeout = setTimeout(() => {
        if (get().callId === payload.callId && get().status === 'incoming') {
          get().rejectCall()
        }
      }, RING_TIMEOUT_MS)
    },
    handleAccept: async (payload) => {
      if (!get().isCaller || get().status !== 'outgoing') return
      if (payload.callId !== get().callId) return
      clearTimer(ringTimeout)
      ringTimeout = null
      const pc = get().peerConnection
      if (!pc) return
      set({ status: 'connecting' })
      startConnectTimeout()
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const currentPayload = buildPayload()
        if (currentPayload && pc.localDescription) {
          emit('call:offer', {
            ...currentPayload,
            sdp: pc.localDescription.toJSON(),
          })
        }
      } catch (error) {
        console.error('Unable to create call offer', error)
        failActiveCall(t('setupFailed'))
      }
    },
    handleOffer: async (payload) => {
      if (
        payload.callId !== get().callId ||
        get().isCaller ||
        get().status !== 'connecting'
      ) {
        return
      }
      const pc = get().peerConnection
      if (!pc) return
      try {
        await pc.setRemoteDescription(payload.sdp)
        await flushCandidates(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        const currentPayload = buildPayload()
        if (currentPayload && pc.localDescription) {
          emit('call:answer', {
            ...currentPayload,
            sdp: pc.localDescription.toJSON(),
          })
        }
      } catch (error) {
        console.error('Unable to handle call offer', error)
        failActiveCall(t('setupFailed'))
      }
    },
    handleAnswer: async (payload) => {
      if (
        payload.callId !== get().callId ||
        !get().isCaller ||
        get().status !== 'connecting'
      ) {
        return
      }
      const pc = get().peerConnection
      if (!pc) return
      try {
        await pc.setRemoteDescription(payload.sdp)
        await flushCandidates(pc)
      } catch (error) {
        console.error('Unable to handle call answer', error)
        failActiveCall(t('setupFailed'))
      }
    },
    handleIce: async (payload) => {
      if (payload.callId !== get().callId) return
      const pc = get().peerConnection
      if (!pc || !pc.remoteDescription) {
        pendingCandidates.push(payload.candidate)
        return
      }
      try {
        await pc.addIceCandidate(payload.candidate)
      } catch (error) {
        console.error('Unable to add ICE candidate', error)
      }
    },
    handleReject: (payload) => {
      if (payload.callId !== get().callId) return
      toast.info(t('callRejected'))
      teardown('ended')
    },
    handleBusy: (payload) => {
      if (payload.callId !== get().callId) return
      toast.info(t('userBusy'))
      teardown('ended')
    },
    handleUnavailable: (payload) => {
      if (payload.callId !== get().callId) return
      toast.error(t('userOffline'))
      teardown('failed')
    },
    handleEnded: (payload) => {
      if (payload.callId !== get().callId) return
      teardown('ended')
    },
    handleHandled: (payload) => {
      if (payload.callId === get().callId && get().status === 'incoming') {
        resetToIdle()
      }
    },
  }
})
