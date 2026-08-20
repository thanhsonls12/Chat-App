import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { ImagePlus, Loader2, Send, X } from 'lucide-react'
import { Input } from '../ui/input'
import EmojiPicker from './EmojiPicker'
import { useChatStore } from '@/stores/useChatStore'
import { useSocketStore } from '@/stores/useSocketStore'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const TYPING_IDLE_MS = 4000
const TYPING_HEARTBEAT_MS = 3000

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
  const emitTyping = useSocketStore((state) => state.emitTyping)
  const [value, setValue] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isTypingRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const conversationId = selectedConvo._id

  const clearTypingTimers = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current)
    idleTimerRef.current = null
    heartbeatTimerRef.current = null
  }

  const stopTyping = () => {
    clearTypingTimers()
    if (isTypingRef.current) {
      isTypingRef.current = false
      emitTyping(conversationId, false)
    }
  }

  const signalTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      emitTyping(conversationId, true)
    } else {
      if (heartbeatTimerRef.current) return
      heartbeatTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) emitTyping(conversationId, true)
        heartbeatTimerRef.current = null
      }, TYPING_HEARTBEAT_MS)
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(stopTyping, TYPING_IDLE_MS)
  }

  useEffect(() => stopTyping, [conversationId])

  if (!user) return
  const canSend = !sending && (value.trim() !== '' || image !== null)

  const pickImage = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp ảnh.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Ảnh phải nhỏ hơn 5 MB.')
      return
    }
    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if (!canSend) return
    const content = value.trim()
    const imageToSend = image
    try {
      setSending(true)
      stopTyping()
      if (selectedConvo.type === 'direct') {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user._id)
        if (!otherUser) {
          toast.error('Không tìm thấy người nhận tin nhắn.')
          return
        }
        await sendDirectMessage(otherUser._id, content, imageToSend ?? undefined)
      } else {
        await sendGroupMessage(selectedConvo._id, content, imageToSend ?? undefined)
      }
      setValue('')
      clearImage()
    } catch (error) {
      toast.error(getSendMessageError(error))
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }
  return (
    <div className="p-3 bg-background">
      {previewUrl && (
        <div className="relative inline-block mb-2">
          <img
            src={previewUrl}
            alt="Ảnh đã chọn"
            className="h-20 max-w-40 object-cover rounded-lg border border-border/50"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 size-5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Bỏ ảnh đã chọn"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 min-h-[56px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickImage(e.target.files?.[0])}
        />
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Chọn ảnh để gửi"
        >
          <ImagePlus className="size-4" />
        </Button>
        <div className="flex-1 relative ">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (e.target.value.trim() !== '') signalTyping()
              else stopTyping()
            }}
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
          disabled={!canSend}
          onClick={sendMessage}
        >
          {sending ? (
            <Loader2 className="size-4 text-white animate-spin" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  )
}
