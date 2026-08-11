import { useChatStore } from '@/stores/useChatStore'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import ChatWindowSkeleton from './ChatWindowSkeleton'
import { SidebarInset } from '../ui/sidebar'
import ChatWindowHeader from './ChatWindowHeader'
import ChatWindowBody from './ChatWindowBody'
import MessageInput from './MessageInput'

export default function ChatWindowLayout() {
  const {
    activeConversationId,
    conversations,
    messageLoading: loading,
  } = useChatStore()
  const selectedConvo = conversations.find(
    (c) => c._id === activeConversationId
  )
  if (!selectedConvo) {
    return <ChatWelcomeScreen />
  }
  if (loading) {
    return <ChatWindowSkeleton />
  }
  return (
    <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-sm">
      <ChatWindowHeader chat={selectedConvo} />
      <div className="flex-1 overflow-y-auto bg-primary-foreground">
        <ChatWindowBody />
      </div>
      <MessageInput selectedConvo={selectedConvo} />
    </SidebarInset>
  )
}
