import { useChatStore } from '@/stores/useChatStore'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'

const LOAD_MORE_THRESHOLD = 80

const NEAR_BOTTOM_THRESHOLD = 120

const EMPTY_MESSAGES: never[] = []

export default function ChatWindowBody() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const initializedConversationRef = useRef<string | null>(null)
  const loadingOlderRef = useRef(false)
  const prevMessageCountRef = useRef(0)
  const prevLastMessageIdRef = useRef<string | null>(null)
  const stickToBottomRef = useRef(true)
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    messageLoading,
    fetchMessages,
  } = useChatStore()
  const user = useAuthStore((state) => state.user)
  const selectedConvo = conversations.find(
    (c) => c._id === activeConversationId
  )

  const currentMessageState = activeConversationId
    ? allMessages[activeConversationId]
    : undefined

  const messages = currentMessageState?.items ?? EMPTY_MESSAGES

  const hasMore = currentMessageState?.hasMore ?? false

  useLayoutEffect(() => {
    if (!activeConversationId || messages.length === 0) return
    const container = scrollContainerRef.current
    if (!container) return

    const lastId = messages[messages.length - 1]?._id ?? null
    const isNewConversation =
      initializedConversationRef.current !== activeConversationId
    const countIncreased = messages.length > prevMessageCountRef.current
    const lastChanged = lastId !== prevLastMessageIdRef.current
    const appendedAtBottom = countIncreased && lastChanged

    if (isNewConversation) {
      container.scrollTop = container.scrollHeight
      stickToBottomRef.current = true
      initializedConversationRef.current = activeConversationId
    } else if (appendedAtBottom && stickToBottomRef.current) {
      container.scrollTop = container.scrollHeight
    }

    prevMessageCountRef.current = messages.length
    prevLastMessageIdRef.current = lastId
  }, [activeConversationId, messages])

  const loadOlderMessages = useCallback(async () => {
    const container = scrollContainerRef.current
    if (
      !container ||
      !activeConversationId ||
      messageLoading ||
      loadingOlderRef.current ||
      !hasMore
    )
      return

    loadingOlderRef.current = true
    const previousScrollHeight = container.scrollHeight
    const previousScrollTop = container.scrollTop
    const requestedConversationId = activeConversationId

    try {
      await fetchMessages(requestedConversationId)
      requestAnimationFrame(() => {
        const currentContainer = scrollContainerRef.current
        if (
          !currentContainer ||
          useChatStore.getState().activeConversationId !==
            requestedConversationId
        )
          return

        const addedHeight =
          currentContainer.scrollHeight - previousScrollHeight
        currentContainer.scrollTop = previousScrollTop + addedHeight
      })
    } finally {
      loadingOlderRef.current = false
    }
  }, [activeConversationId, fetchMessages, hasMore, messageLoading])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    stickToBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD

    if (container.scrollTop < LOAD_MORE_THRESHOLD) {
      void loadOlderMessages()
    }
  }, [loadOlderMessages])

  if (!selectedConvo) {
    return <ChatWelcomeScreen />
  }

  const isLastMessageMine = selectedConvo.lastMessage?.sender?._id === user?._id

  const hasOtherUserSeen = selectedConvo.seenBy.some(
    (seenUser) => seenUser._id !== user?._id
  )

  const lastMessageStatus: 'delivered' | 'seen' =
    isLastMessageMine && hasOtherUserSeen ? 'seen' : 'delivered'

  if (!messages?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
        <TypingIndicator conversation={selectedConvo} />
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto overflow-x-hidden beautiful-scrollbar bg-primary-foreground"
    >
      <div className="flex min-h-full flex-col gap-1 p-4">
        <div aria-hidden className="mt-auto" />
        {messageLoading && hasMore && (
          <div className="flex justify-center py-2">
            <LoaderCircle
              className="size-5 animate-spin text-muted-foreground"
              aria-label="Đang tải tin nhắn cũ"
            />
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Bạn đã xem hết tin nhắn
          </p>
        )}

        {messages.map((message, index) => (
          <MessageItem
            key={message._id}
            message={message}
            index={index}
            messages={messages}
            selectedConvo={selectedConvo}
            lastMessageStatus={lastMessageStatus}
          />
        ))}
        <TypingIndicator conversation={selectedConvo} />
      </div>
    </div>
  )
}
