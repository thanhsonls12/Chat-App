import { useChatStore } from '@/stores/useChatStore'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import MessageItem from './MessageItem'
import { useAuthStore } from '@/stores/useAuthStore'

export default function ChatWindowBody() {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
  } = useChatStore()
  const user = useAuthStore((state) => state.user)
  const selectedConvo = conversations.find(
    (c) => c._id === activeConversationId
  )
  if (!selectedConvo) {
    return <ChatWelcomeScreen />
  }

  const messages = activeConversationId
    ? (allMessages[activeConversationId]?.items ?? [])
    : []

  const isLastMessageMine =
    selectedConvo.lastMessage?.sender?._id === user?._id

  const hasOtherUserSeen = selectedConvo.seenBy.some(
    (seenUser) => seenUser._id !== user?._id
  )

  const lastMessageStatus: 'delivered' | 'seen' =
    isLastMessageMine && hasOtherUserSeen ? 'seen' : 'delivered'

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chưa có tin nhắn nào trong cuộc trò chuyện này
      </div>
    )
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div className="flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar">
        {messages.map((message, index) => (
          <MessageItem
            key={message._id ?? index}
            message={message}
            index={index}
            messages={messages}
            selectedConvo={selectedConvo}
            lastMessageStatus={lastMessageStatus}
          />
        ))}
      </div>
    </div>
  )
}
