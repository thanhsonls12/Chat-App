export interface SendDirectMessageBody {
  recipientId?: string
  conversationId?: string
  content?: string
  imgUrl?: string
}

export interface SendGroupMessageBody {
  conversationId: string
  content?: string
  imgUrl?: string
}
