import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import type { Conversation } from '@/types/chat'
import ChatCard from './ChatCard'
import UnreadCountBadge from './UnreadCountBadge'
import GroupChatAvatar from './GroupChatAvatar'

export default function GroupChatCard({
  conversation,
}: {
  conversation: Conversation
}) {
  const { user } = useAuthStore()
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
    markConversationRead,
  } = useChatStore()

  if (!user) return null
  const unreadCount = conversation.unreadCounts[user._id]
  const name = conversation.group.name ?? ''
  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id)
    if (!messages[id] || messages[id].nextCursor === undefined) {
      await fetchMessages(id)
    }
    await markConversationRead(id)
  }
  return (
    <ChatCard
      conversationId={conversation._id}
      name={name}
      timestamp={
        conversation.lastMessage?.createdAt
          ? new Date(conversation.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === conversation._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          <GroupChatAvatar
            participants={conversation.participants}
            type="chat"
          />
        </>
      }
      subtitle={
        <p className="text-sm truncate text-muted-foreground">
          {conversation.participants.length} members
        </p>
      }
    />
  )
}
