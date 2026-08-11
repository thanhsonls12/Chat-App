import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ImagePlus, Send } from 'lucide-react'
import { Input } from '../ui/input'
import EmojiPicker from './EmojiPicker'
import { useChatStore } from '@/stores/useChatStore'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, { msg?: string }>
}

const getSendMessageError = (error: unknown) => {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return 'Unable to send message. Please try again.'
  }

  const data = error.response?.data
  const validationMessage = data?.errors
    ? Object.values(data.errors).find((value) => value.msg)?.msg
    : undefined

  return validationMessage ?? data?.message ?? 'Unable to send message. Please try again.'
}

export default function MessageInput({
  selectedConvo,
}: {
  selectedConvo: Conversation
}) {
  const { user } = useAuthStore()
  const { sendDirectMessage, sendGroupMessage } = useChatStore()
  const [value, setValue] = useState('')
  if (!user) return
  const sendMessage = async () => {
    if (!value.trim()) return
    try {
      if (selectedConvo.type === 'direct') {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user._id)
        if (!otherUser) {
          toast.error('Không tìm thấy người nhận tin nhắn.')
          return
        }
        await sendDirectMessage(otherUser._id, value)
      } else {
        await sendGroupMessage(selectedConvo._id, value)
      }
      setValue('')
    } catch (error) {
      toast.error(getSendMessageError(error))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }
  return (
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth"
      >
        <ImagePlus className="size-4" />
      </Button>
      <div className="flex-1 relative ">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Soạn tin nhắn..."
          className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          onKeyDown={handleKeyPress}
        ></Input>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-primary/10 transition-smooth"
          >
            <div>
              <EmojiPicker
                onChange={(emoji: string) => setValue(`${value}${emoji}`)}
              />
            </div>
          </Button>
        </div>
      </div>
      <Button
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim()}
        onClick={sendMessage}
      >
        <Send className="size-4 text-white" />
      </Button>
    </div>
  )
}
