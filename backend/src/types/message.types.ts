import type { ParamsDictionary } from 'express-serve-static-core'

export interface SendDirectMessageBody {
  recipientId?: string
  conversationId?: string
  content?: string
}

export interface SendGroupMessageBody {
  conversationId: string
  content?: string
}

export interface EditMessageBody {
  content?: string
}

export interface MessageIdParams extends ParamsDictionary {
  messageId: string
}
