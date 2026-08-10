import { useChatStore } from '@/stores/useChatStore'
import GroupChatCard from './GroupChatCard'

export default function GroupChatList() {
  const { conversations } = useChatStore()
  if (!conversations) return
  const groupChats = conversations.filter((c) => c.type === 'group')

  return (
    <div>
      {groupChats.map((conversation) => (
        <GroupChatCard conversation={conversation} key={conversation._id} />
      ))}
    </div>
  )
}
