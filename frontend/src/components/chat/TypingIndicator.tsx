import { useSocketStore } from '@/stores/useSocketStore'
import type { Conversation } from '@/types/chat'

const buildLabel = (names: string[], isGroup: boolean) => {
  if (!isGroup) return 'đang soạn tin'
  if (names.length === 1) return `${names[0]} đang soạn tin`
  if (names.length === 2) return `${names[0]} và ${names[1]} đang soạn tin`
  return `${names[0]} và ${names.length - 1} người khác đang soạn tin`
}

export default function TypingIndicator({
  conversation,
}: {
  conversation: Conversation
}) {
  const typingUsers = useSocketStore(
    (state) => state.typingUsers[conversation._id]
  )

  if (!typingUsers?.length) return null

  const label = buildLabel(
    typingUsers.map((u) => u.displayName),
    conversation.type === 'group'
  )

  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      <span>{label}</span>
    </div>
  )
}
