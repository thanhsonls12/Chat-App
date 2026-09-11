import { useSocketStore } from '@/stores/useSocketStore'
import type { Conversation } from '@/types/chat'
import { useI18n } from '@/i18n'

export default function TypingIndicator({
  conversation,
}: {
  conversation: Conversation
}) {
  const { t } = useI18n()
  const typingUsers = useSocketStore(
    (state) => state.typingUsers[conversation._id]
  )

  if (!typingUsers?.length) return null

  const names = typingUsers.map((u) => u.displayName)
  const label =
    conversation.type !== 'group'
      ? t('typing')
      : names.length === 1
        ? `${names[0]} ${t('typing')}`
        : names.length === 2
          ? `${names[0]} ${t('and')} ${names[1]} ${t('typing')}`
          : `${names[0]} ${t('and')} ${names.length - 1} ${t('andOtherTyping')}`

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
