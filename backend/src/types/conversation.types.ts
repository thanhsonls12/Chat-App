import type { ParamsDictionary, Query } from 'express-serve-static-core'

export type ConversationType = 'direct' | 'group'

export interface CreateConversationBody {
  type: ConversationType
  name?: string
  memberIds: string[]
}

export interface GetMessagesParams extends ParamsDictionary {
  conversationId: string
}

export interface GetMessagesQuery extends Query {
  limit?: string
  cursor?: string
}
