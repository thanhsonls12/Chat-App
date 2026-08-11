import { cn, formatMessageTime } from '@/lib/utils'
import type { Conversation, Message, Participant } from '@/types/chat'
import UserAvatar from './UserAvatar'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface MessageItemProps {
  message: Message
  index: number
  messages: Message[]
  selectedConvo: Conversation
  lastMessageStatus: 'delivered' | 'seen'
}
export default function MessageItem({
  index,
  lastMessageStatus,
  message,
  messages,
  selectedConvo,
}: MessageItemProps) {
  const prev = messages[index - 1]
  const isGroupBreak =
    index === 0 ||
    message.senderId !== prev?.senderId ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt).getTime() >
      5 * 60 * 1000
  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  )
  return (
    <div
      className={cn(
        'flex gap-2 message-bounce',
        message.isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!message.isOwn && (
        <div className="w-8">
          {isGroupBreak && (
            <UserAvatar
              type="chat"
              name={participant?.displayName ?? 'Chat'}
              avatarUrl={participant?.avatarUrl ?? undefined}
            />
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-xs lg:max-w-md space-y-1 flex flex-col',
          message.isOwn ? 'items-end' : 'items-start'
        )}
      >
        <Card
          className={cn(
            'p-3',
            message.isOwn
              ? 'chat-bubble-sent border-0'
              : 'chat-bubble-received border-0'
          )}
        >
          <p className="text-sm leading-relaxed break-words">
            {message.content}
          </p>
        </Card>
        {isGroupBreak && (
          <span className="text-xs text-muted-foreground px-1">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        )}
        {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs px-1.5 py-0.5 h-4 border-0',
              lastMessageStatus === 'seen'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          ></Badge>
        )}
      </div>
    </div>
  )
}
