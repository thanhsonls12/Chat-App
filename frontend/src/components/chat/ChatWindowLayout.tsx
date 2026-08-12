import { useChatStore } from '@/stores/useChatStore'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import ChatWindowSkeleton from './ChatWindowSkeleton'
import { SidebarInset } from '../ui/sidebar'
import ChatWindowHeader from './ChatWindowHeader'
import ChatWindowBody from './ChatWindowBody'
import MessageInput from './MessageInput'

export default function ChatWindowLayout() {
  const { activeConversationId, conversations, messages, messageLoading } =
    useChatStore()
  const selectedConvo = conversations.find(
    (c) => c._id === activeConversationId
  )
  if (!selectedConvo) {
    return <ChatWelcomeScreen />
  }
  const currentMessages = activeConversationId
    ? messages[activeConversationId]?.items
    : undefined

  const isInitialLoading = messageLoading && currentMessages === undefined
  if (isInitialLoading) {
    return <ChatWindowSkeleton />
  }
  return (
    <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-sm">
      <ChatWindowHeader chat={selectedConvo} />
      <div className="flex-1 min-h-0 overflow-hidden bg-primary-foreground">
        <ChatWindowBody />
      </div>
      <MessageInput selectedConvo={selectedConvo} />
    </SidebarInset>
  )
}
