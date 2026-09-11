export type CallStatus =
  | 'idle'
  | 'preparing'
  | 'outgoing'
  | 'incoming'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'failed'

export interface CallPeer {
  _id: string
  displayName: string
  avatarUrl?: string
}

export interface CallPayload {
  callId: string
  conversationId: string
  callerId: string
  receiverId: string
}

export interface CallInvitePayload extends CallPayload {
  caller: CallPeer
}

export interface CallOfferPayload extends CallPayload {
  sdp: RTCSessionDescriptionInit
}

export interface CallAnswerPayload extends CallPayload {
  sdp: RTCSessionDescriptionInit
}

export interface CallIcePayload extends CallPayload {
  candidate: RTCIceCandidateInit
}

export interface CallRejectPayload extends CallPayload {
  reason?: string
}

export interface CallHandledPayload {
  callId: string
}
