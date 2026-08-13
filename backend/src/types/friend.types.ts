import type { ParamsDictionary } from 'express-serve-static-core'
import type { Query } from 'express-serve-static-core'

export interface SendFriendRequestBody {
  to: string
  message?: string
}

export interface FriendRequestIdParams extends ParamsDictionary {
  requestId: string
}

export interface SearchUserQuery extends Query {
  username: string
}
