import { useChatStore } from '@/stores/useChatStore'
import DirectMessageCard from './DirectMessageCard'

export default function DirectMessageList() {
  const { conversations } = useChatStore()
  if (!conversations) return
  const directConversation = conversations.filter((c) => c.type === 'direct')
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {directConversation.map((conversation) => (
        <DirectMessageCard conversation={conversation} key={conversation._id} />
      ))}
    </div>
  )
}
