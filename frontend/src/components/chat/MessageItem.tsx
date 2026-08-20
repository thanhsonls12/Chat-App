import { cn, formatMessageTime } from '@/lib/utils'
import type { Conversation, Message, Participant } from '@/types/chat'
import UserAvatar from './UserAvatar'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Check, MoreHorizontal, Pencil, Undo2, X } from 'lucide-react'
import { useState } from 'react'
import { useChatStore } from '@/stores/useChatStore'
import { toast } from 'sonner'

const RECALLED_TEXT = 'Tin nhắn đã được thu hồi'

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
  const { editMessage, deleteMessage } = useChatStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content ?? '')
  const [saving, setSaving] = useState(false)

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

  const isRecalled = !!message.deletedAt
  const canEdit = !!message.isOwn && !isRecalled && !!message.content
  const canRecall = !!message.isOwn && !isRecalled

  const startEditing = () => {
    setDraft(message.content ?? '')
    setEditing(true)
  }

  const saveEdit = async () => {
    const content = draft.trim()
    if (!content || content === message.content) {
      setEditing(false)
      return
    }
    try {
      setSaving(true)
      await editMessage(message._id, content)
      setEditing(false)
    } catch {
      toast.error('Không sửa được tin nhắn. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const recall = async () => {
    try {
      await deleteMessage(message._id)
    } catch {
      toast.error('Không thu hồi được tin nhắn. Vui lòng thử lại.')
    }
  }

  return (
    <div
      className={cn(
        'group flex gap-2 message-bounce',
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

      {(canEdit || canRecall) && !editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 self-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Tùy chọn tin nhắn"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={startEditing}>
                <Pencil className="size-4" />
                Sửa
              </DropdownMenuItem>
            )}
            {canRecall && (
              <DropdownMenuItem variant="destructive" onClick={recall}>
                <Undo2 className="size-4" />
                Thu hồi
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div
        className={cn(
          'max-w-xs lg:max-w-md space-y-1 flex flex-col',
          message.isOwn ? 'items-end' : 'items-start'
        )}
      >
        {editing ? (
          <div className="flex w-full items-center gap-1">
            <Input
              autoFocus
              value={draft}
              disabled={saving}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void saveEdit()
                }
                if (e.key === 'Escape') setEditing(false)
              }}
              className="h-8 text-sm"
              aria-label="Sửa tin nhắn"
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={saving}
              onClick={saveEdit}
              aria-label="Lưu tin nhắn"
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={saving}
              onClick={() => setEditing(false)}
              aria-label="Hủy sửa tin nhắn"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Card
            className={cn(
              message.imgUrl ? 'p-1' : 'p-3',
              message.isOwn
                ? 'chat-bubble-sent border-0'
                : 'chat-bubble-received border-0'
            )}
          >
            {isRecalled ? (
              <p className="text-sm italic leading-relaxed opacity-70">
                {RECALLED_TEXT}
              </p>
            ) : (
              <>
                {message.imgUrl && (
                  <img
                    src={message.imgUrl}
                    alt="Ảnh tin nhắn"
                    loading="lazy"
                    className="rounded-lg max-w-60 max-h-60 object-cover cursor-pointer"
                    onClick={() => window.open(message.imgUrl!, '_blank')}
                  />
                )}
                {message.content && (
                  <p className="text-sm leading-relaxed break-words">
                    {message.content}
                  </p>
                )}
              </>
            )}
          </Card>
        )}
        {(isGroupBreak || message.editedAt) && !editing && (
          <span className="text-xs text-muted-foreground px-1">
            {formatMessageTime(new Date(message.createdAt))}
            {message.editedAt && !isRecalled && ' · đã sửa'}
          </span>
        )}
        {message.isOwn &&
          !isRecalled &&
          message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0.5 h-4 border-0',
                lastMessageStatus === 'seen'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {lastMessageStatus === 'seen' ? 'Đã xem' : 'Đã gửi'}
            </Badge>
          )}
      </div>
    </div>
  )
}
